use std::cmp::min;

use chrono::Utc;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::common::job_status_plus::JobStatusPlus;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;

// TODO: These numbers are made up. We should measure the average job durations.
const COMFY_JOB_AVERAGE_SECONDS : u64 = 60 * 4;
const LIPSYNC_JOB_AVERAGE_SECONDS : u64 = 60 * 3;
const TTS_JOB_AVERAGE_SECONDS : u64 = 7;
const VC_JOB_AVERAGE_SECONDS : u64 = 90;

pub fn estimate_job_progress(job: &GenericInferenceJobStatus) -> u8 {
  match job.status {
    // Jobs that haven't started
    JobStatusPlus::Pending
    | JobStatusPlus::AttemptFailed => return 0,
    // Jobs that are "done"
    JobStatusPlus::CompleteSuccess
    | JobStatusPlus::CompleteFailure
    | JobStatusPlus::Dead
    | JobStatusPlus::CancelledByUser
    | JobStatusPlus::CancelledBySystem => return 100,
    // Fall through
    JobStatusPlus::Started => {}
  }

  // TODO: This is inaccurate under retries
  //  "mark_generic_inference_job_pending_and_grab_lock" only sets "maybe_first_started_at"
  //  for the first execution, not retries. It's not clear that this is a valuable behavior,
  //  and perhaps the code should be updated to always write every job attempt's start time.
  let started_at= job.maybe_first_started_at.unwrap_or(job.created_at);

  let now = job.database_clock;

  if started_at < now {
    return 0; // We shouldn't see clock skew unless we read from a DB replica.
  }

  let duration = now.signed_duration_since(started_at);
  let duration_seconds = duration.num_seconds().abs() as u64;

  // TODO: Estimate functions based on duration for each job type
  //  This might also take parameters: the job arguments, text length,
  //  video length (currently unavailable - we'll need to put that in the
  //  job metadata), etc.
  let progress = match job.request_details.inference_category {
    InferenceCategory::LipsyncAnimation => percent(duration_seconds, LIPSYNC_JOB_AVERAGE_SECONDS),
    InferenceCategory::TextToSpeech => percent(duration_seconds, TTS_JOB_AVERAGE_SECONDS),
    InferenceCategory::VoiceConversion => percent(duration_seconds, VC_JOB_AVERAGE_SECONDS),

    // TODO: Better estimate using video duration, params, etc.
    InferenceCategory::Workflow => percent(duration_seconds, COMFY_JOB_AVERAGE_SECONDS),

    // NB: We don't run these job types anymore.
    InferenceCategory::FormatConversion => 0,
    InferenceCategory::Mocap => 0,
    InferenceCategory::ImageGeneration => 0,
    InferenceCategory::VideoFilter => 0,
    InferenceCategory::ConvertBvhToWorkflow => 0,
  };

  // We shouldn't show 100% if the job isn't complete.
  min(progress, 95)
}

fn percent(numerator: u64, denominator: u64) -> u8 {
  if denominator == 0 {
    return 0;
  }
  let percent = (numerator as f64 / denominator as f64) * 100.0;
  let percent = percent as u8;

  min(percent, 100)
}

#[cfg(test)]
mod tests {
  #[test]
  fn test_percent() {
    assert_eq!(0, super::percent(0, 0));
    assert_eq!(0, super::percent(0, 100));
    assert_eq!(50, super::percent(50, 100));
    assert_eq!(100, super::percent(100, 100));
    assert_eq!(100, super::percent(500, 100));
    assert_eq!(25, super::percent(1, 4));
    assert_eq!(50, super::percent(2, 4));
    assert_eq!(75, super::percent(3, 4));
    assert_eq!(100, super::percent(4, 4));
    assert_eq!(100, super::percent(5, 4));
  }
}
