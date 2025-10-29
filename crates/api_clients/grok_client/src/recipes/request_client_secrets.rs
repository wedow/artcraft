use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
use crate::requests::index_page::get_xsid_script::{get_xsid_script, GetXsidScriptArgs};
use crate::requests::index_page::parsers::index::parse_index_baggage::parse_index_baggage;
use crate::requests::index_page::parsers::index::parse_index_sentry_trace::parse_index_sentry_trace;
use crate::requests::index_page::parsers::index::parse_index_svg_paths::parse_svg_paths_from_index_html;
use crate::requests::index_page::parsers::index::parse_index_verification_token::parse_index_verification_token;
use crate::requests::index_page::parsers::script::parse_script_actions_and_xsid_script_path::parse_script_actions_and_xsid_script_path;
use crate::requests::index_page::parsers::script::parse_xsid_script_numbers::parse_xsid_script_numbers;
use crate::requests::index_page::pieces::baggage::Baggage;
use crate::requests::index_page::pieces::sentry_trace::SentryTrace;
use crate::requests::index_page::pieces::svg_path_data::SvgPathData;
use crate::requests::index_page::pieces::verification_token::VerificationToken;
use crate::requests::index_page::pieces::xsid_numbers::XsidNumbers;
use crate::requests::index_page::utils::convert_verification_token_to_loading_anim::convert_verification_token_to_loading_anim;
use crate::requests::index_page::utils::select_svg_path_by_loading_anim::select_svg_path_by_loading_anim;
use std::collections::HashMap;

pub struct RequestClientSecretsArgs<'a> {
  pub cookies: &'a str,
}

// Video generation needs:
// 1) baggage -- on index page
// 2) sentry_trace -- on index page
// 3) x_statsig
pub struct ClientSecrets {
  /// From the index HTML meta tag
  pub baggage: Baggage,

  /// From the index HTML meta tag
  pub sentry_trace: SentryTrace,

  /// From the index HTML meta tag
  pub verification_token: VerificationToken,

  /// The SVG path data to use (chosen via verification_token)
  /// We selected one of four-ish possible SVG paths (of length >= 200) by
  /// the `verification token -> animation index` algo.
  pub svg_path: SvgPathData,
  
  /// Numbers from the xsid script.
  pub numbers: XsidNumbers,

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

  let sentry_trace = parse_index_sentry_trace(&payloads.index_body_html)
      .ok_or_else(|| GrokGenericApiError::IndexHtmlDidNotIncludeExpectedData {
        message: "Index did not include sentry trace.".to_string()
      })?;

  let verification_token = parse_index_verification_token(&payloads.index_body_html)
      .ok_or_else(|| GrokGenericApiError::IndexHtmlDidNotIncludeExpectedData {
        message: "Index did not include verification token.".to_string()
      })?;

  // NB: We'll only use one of the several SVG paths
  let svg_paths = parse_svg_paths_from_index_html(&payloads.index_body_html);

  if svg_paths.is_empty() {
    return Err(GrokGenericApiError::IndexHtmlDidNotIncludeExpectedData {
      message: "Index did not include any SVG paths.".to_string(),
    }.into());
  }

  let loading_anim = convert_verification_token_to_loading_anim(&verification_token)?;

  let svg_path = select_svg_path_by_loading_anim(&svg_paths, &loading_anim)?;

  let actions_and_xsid_script = parse_script_actions_and_xsid_script_path(&payloads.scripts)?;

  let xsid_script = get_xsid_script(GetXsidScriptArgs {
    client: &payloads.client,
    html: &payloads.index_body_html,
    cookie: &args.cookies,
    xsid_script_id: &actions_and_xsid_script.xsid_script_path,
  }).await?;

  let numbers = parse_xsid_script_numbers(&xsid_script.xsid_script_body);

  if numbers.numbers.is_empty() {
    return Err(GrokGenericApiError::IndexHtmlDidNotIncludeExpectedData {
      message: "Index did not include any SVG paths.".to_string(),
    }.into());
  }

  // TODO: xsid

  // xsid: str = Signature.generate_sign(
  //   '/rest/app-chat/conversations/new',
  //   'POST',
  //   self.verification_token,
  //   self.svg_data,
  //   self.numbers
  // )

  Ok(ClientSecrets {
    baggage,
    sentry_trace,
    verification_token,
    svg_path,
    numbers,
    scripts: payloads.scripts,
  })
}

#[cfg(test)]
mod tests {
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookie,
    }).await?;

    println!("Baggage: {:?}", secrets.baggage);
    println!("Sentry trace: {:?}", secrets.sentry_trace);
    println!("Verification token: {:?}", secrets.verification_token);
    println!("SVG path: {:?}", secrets.svg_path);
    println!("Numbers: {:?}", secrets.numbers);

    assert_eq!(1, 2);
    Ok(())
  }
}