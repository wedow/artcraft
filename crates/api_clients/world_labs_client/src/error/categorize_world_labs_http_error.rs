use crate::error::world_labs_error::WorldLabsError;
use crate::error::world_labs_generic_api_error::WorldLabsGenericApiError;
use crate::error::world_labs_specific_api_error::WorldLabsSpecificApiError;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::StatusCode;

/// We know the response is an error at this point.
/// We're just turning it into the right error.
pub fn categorize_grok_http_error(status_code: StatusCode, maybe_body: Option<&str>) -> WorldLabsError {

  if let Some(body) = maybe_body {
    if let Err(err) = filter_cloudflare_errors(status_code.as_u16(), body) {
      return WorldLabsGenericApiError::CloudflareError(err).into();
    }

    let body = body.to_lowercase();
    let anti_bot = body.contains("anti-bot") || body.contains("rejected");

    if anti_bot {
      return WorldLabsSpecificApiError::AutomationBlocked.into();
    }

    match status_code {
      StatusCode::TOO_MANY_REQUESTS => {
        return WorldLabsSpecificApiError::TooManyVideos.into();
      }
      _ => {},
    }

    return WorldLabsGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code,
      body: body.to_string(),
    }.into();
  }

  WorldLabsGenericApiError::UncategorizedBadResponseWithStatus(status_code).into()
}
