use std::collections::HashMap;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
use crate::requests::index_page::index_parsers::parse_index_baggage::parse_index_baggage;

pub struct RequestClientSecretsArgs<'a> {
  pub cookies: &'a str,
}

// Video generation needs:
// 1) baggage -- on index page
// 2) sentry_trace -- on index page
// 3) x_statsig
pub struct ClientSecrets {
  /// From the index HTML meta tag
  pub baggage: String,
  
  /// From the index HTML meta tag
  pub sentry_trace: String,
  
  /// Scripts (for later use)
  pub scripts: HashMap<String, String>,
}

/// Load all the things needed to make requests.
pub async fn request_client_secrets(args: RequestClientSecretsArgs<'_>) -> Result<ClientSecrets, GrokError> {
  
  let payloads = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
    cookie: args.cookies,
  }).await?;
  
  let baggage = parse_index_baggage(&payloads.index_body_html)
      .ok_or_else(|| GrokGenericApiError::IndexHtmlDidNotIncludeExpectedData { 
        message: "Index did not include baggage.".to_string() 
      })?;

  
  
  Ok(ClientSecrets {
    baggage,
    sentry_trace: "TODO".to_string(),
    scripts: payloads.scripts,
  })
}

