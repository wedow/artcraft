use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::poll_orders::request_types::*;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

const GET_ORDERS_BASE_URL: &str = "https://seedance2-pro.com/api/trpc/userOrder.getOrders";

/// The fixed tRPC input for fetching recent orders (limit 30, forward direction).
const ORDERS_INPUT_JSON: &str =
  r#"{"0":{"json":{"limit":30,"format":null,"direction":"forward"},"meta":{"values":{"format":["undefined"]},"v":1}}}"#;

const FIREFOX_USER_AGENT: &str =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:147.0) Gecko/20100101 Firefox/147.0";

// --- Public types ---

/// The lifecycle status of a video generation task.
#[derive(Debug, Clone, PartialEq)]
pub enum TaskStatus {
  /// The task is queued and has not started yet.
  Pending,
  /// The task is actively being processed.
  Processing,
  /// The task finished successfully. `result_url` and `results` will be populated.
  Completed,
  /// The task failed. `fail_reason` will contain the reason.
  Failed,
  /// An unrecognised status string was returned by the server.
  Unknown(String),
}

impl TaskStatus {
  fn from_str(s: &str) -> Self {
    match s {
      "PENDING" => Self::Pending,
      "PROCESSING" => Self::Processing,
      "COMPLETED" => Self::Completed,
      "FAILED" => Self::Failed,
      other => Self::Unknown(other.to_string()),
    }
  }

  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Completed | Self::Failed)
  }
}

/// A single generated video result attached to an order.
#[derive(Debug, Clone)]
pub struct VideoResult {
  pub url: String,
  pub width: u32,
  pub height: u32,
  /// Width / height ratio (e.g. 1.777… for 16:9).
  pub ratio: f64,
}

/// The status of one order (one video generation task).
#[derive(Debug, Clone)]
pub struct OrderStatus {
  pub order_id: String,
  pub task_status: TaskStatus,
  /// Top-level result video URL. Populated when `task_status` is `Completed`.
  pub result_url: Option<String>,
  /// Detailed result entries. Typically one entry per video.
  pub results: Vec<VideoResult>,
  /// Failure reason. Populated when `task_status` is `Failed`.
  pub fail_reason: Option<String>,
  /// ISO 8601 creation timestamp (e.g. `"2026-02-19T01:20:50.398Z"`).
  pub created_at: String,
}

// --- Args & response ---

pub struct PollOrdersArgs<'a> {
  pub session: &'a Seedance2ProSession,
  /// Order IDs to filter for. The API always returns recent orders; we filter client-side.
  /// If empty, all orders in the response are returned.
  pub order_ids: Vec<String>,
}

pub struct PollOrdersResponse {
  pub orders: Vec<OrderStatus>,
}

// --- Implementation ---

pub async fn poll_orders(args: PollOrdersArgs<'_>) -> Result<PollOrdersResponse, Seedance2ProError> {
  info!("Polling orders (filter: {:?})", args.order_ids);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let cookie = args.session.cookies.as_str();

  let response = client.get(GET_ORDERS_BASE_URL)
    .query(&[("batch", "1"), ("input", ORDERS_INPUT_JSON)])
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", "https://seedance2-pro.com/app/gallery")
    .header("content-type", "application/json")
    .header("x-trpc-source", "client")
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Poll orders response status: {}", status);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let raw_orders = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json
    .orders;

  let orders: Vec<OrderStatus> = raw_orders
    .into_iter()
    .filter(|o| args.order_ids.is_empty() || args.order_ids.contains(&o.order_id))
    .map(|o| OrderStatus {
      order_id: o.order_id,
      task_status: TaskStatus::from_str(&o.task_status),
      result_url: o.result_url,
      results: o.results.into_iter().map(|r| VideoResult {
        url: r.url,
        width: r.width,
        height: r.height,
        ratio: r.ratio,
      }).collect(),
      fail_reason: o.fail_reason,
      created_at: o.created_at,
    })
    .collect();

  info!("Polled {} matching orders", orders.len());

  Ok(PollOrdersResponse { orders })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_all_orders() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let args = PollOrdersArgs {
      session: &session,
      order_ids: vec![],
    };
    let result = poll_orders(args).await?;
    println!("Orders returned: {}", result.orders.len());
    for order in &result.orders {
      println!("  {} | {:?} | result_url={:?} | fail={:?}",
        order.order_id, order.task_status, order.result_url, order.fail_reason);
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_poll_specific_orders() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let args = PollOrdersArgs {
      session: &session,
      order_ids: vec![
        "ord_zfrcdtgscx506j60n7oq0lp9".to_string(),
        "ord_t0uhyqwfphrzakxwi6w6ihek".to_string(),
      ],
    };
    let result = poll_orders(args).await?;
    println!("Orders returned: {}", result.orders.len());
    for order in &result.orders {
      println!("  {} | {:?} | url={:?} | fail={:?}",
        order.order_id, order.task_status, order.result_url, order.fail_reason);
      for video in &order.results {
        println!("    video: {} ({}x{})", video.url, video.width, video.height);
      }
    }
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
