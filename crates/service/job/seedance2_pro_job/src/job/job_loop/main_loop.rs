use std::collections::HashMap;
use std::time::Duration;

use log::{error, info, warn};
use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use mysql_queries::queries::generic_inference::job::mark_job_failed_by_token::{mark_job_failed_by_token, MarkJobFailedByTokenArgs};
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_jobs::list_pending_seedance2pro_jobs;
use seedance2pro::requests::poll_orders::poll_orders::{poll_orders, PollOrdersArgs, TaskStatus};

use crate::job::job_loop::process_completed_order::{mark_job_failed, process_completed_order};
use crate::job_dependencies::JobDependencies;

pub async fn main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let result = run_poll_iteration(&job_dependencies).await;

    if let Err(err) = result {
      error!("Error in poll iteration: {:?}", err);
      let _ = job_dependencies.job_stats.increment_failure_count();
    }

    tokio::time::sleep(Duration::from_millis(job_dependencies.poll_interval_millis)).await;
  }

  warn!("Seedance2Pro job runner main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  // 1. Query all non-terminal Seedance2Pro jobs from DB.
  let pending_jobs = list_pending_seedance2pro_jobs(&deps.mysql_pool).await?;

  if pending_jobs.is_empty() {
    info!("No pending Seedance2Pro jobs.");
    return Ok(());
  }

  info!("Found {} pending Seedance2Pro job(s).", pending_jobs.len());

  // Build a lookup: order_id -> job
  let mut job_by_order_id: HashMap<String, _> = pending_jobs
    .into_iter()
    .map(|job| (job.order_id.clone(), job))
    .collect();

  // 2. Poll all orders from seedance2pro API (exhausting pagination).
  let mut all_orders = Vec::new();
  let mut cursor: Option<u64> = None;

  loop {
    let response = poll_orders(PollOrdersArgs {
      session: &deps.seedance2pro_session,
      cursor,
    })
      .await
      .map_err(|err| {
        warn!("Error polling seedance2pro orders: {:?}", err);
        anyhow::anyhow!("poll_orders failed: {:?}", err)
      })?;

    info!("Polled {} orders (cursor={:?})", response.orders.len(), cursor);
    all_orders.extend(response.orders);

    cursor = response.next_cursor;
    if cursor.is_none() {
      break;
    }
  }

  // 3. Match API orders to DB jobs and process terminal ones.
  for order in &all_orders {
    let job = match job_by_order_id.remove(&order.order_id) {
      Some(j) => j,
      None => continue, // Not one of our pending jobs.
    };

    match &order.task_status {
      TaskStatus::Completed => {
        info!(
          "Order {} completed, processing job {}",
          order.order_id,
          job.job_token.as_str()
        );
        if let Err(err) = process_completed_order(deps, &job, order).await {
          warn!(
            "Error processing completed order {}: {:?}",
            order.order_id, err
          );
          let _ = deps.job_stats.increment_failure_count();
        } else {
          let _ = deps.job_stats.increment_success_count();
        }
      }
      TaskStatus::Failed => {
        let reason = order
          .fail_reason
          .as_deref()
          .unwrap_or("unknown failure reason");

        let reason_lower = reason.to_lowercase();

        let platform_rules_violation = reason_lower.contains("violates") ||
            reason_lower.contains("platform rules") ||
            reason_lower.contains("please modify");

        let frontend_failure_category = if platform_rules_violation {
          Some(FrontendFailureCategory::ModelRulesViolation)
        } else {
          None
        };

        warn!(
          "Order {} failed: {}. Marking job {} failed.",
          order.order_id, reason, job.job_token.as_str()
        );

        let mark_failed_result = mark_job_failed_by_token(MarkJobFailedByTokenArgs {
          pool: &deps.mysql_pool,
          job_token: &job.job_token,
          maybe_public_failure_reason: Some(reason),
          internal_debugging_failure_reason: reason,
          maybe_frontend_failure_category: frontend_failure_category,
        }).await;

        if let Err(err) = mark_failed_result {
          error!(
            "Error marking job {} as failed: {:?}",
            job.job_token.as_str(),
            err
          );
        }
      }
      TaskStatus::Pending | TaskStatus::Processing => {
        // Still in progress — check again next poll.
      }
      TaskStatus::Unknown(unknown_status) => {
        // NB: Keep polling it?
        warn!("Unknown order status: {:?}", unknown_status);
      }
    }
  }

  Ok(())
}
