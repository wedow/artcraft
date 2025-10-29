use crate::error::grok_client_error::GrokClientError;
use once_cell::sync::Lazy;
use regex::Regex;
use std::collections::HashMap;

static ACTIONS_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"createServerReference\)\("([a-f0-9]+)""#)
      .expect("Regex should parse")
});

static XSID_SCRIPT_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""(static/chunks/[^"]+\.js)"[^}]*?a\(880932\)"#)
      .expect("Regex should parse")
});

#[derive(Debug, Clone)]
pub struct ActionsAndXsid {
  /// A list of opaque IDs for "actions"
  pub actions: Vec<String>,

  /// The URL path of the xsid script, with no leading slash.
  pub xsid_script_path: String,
}

pub fn parse_script_actions_and_xsid_script_path(scripts: &HashMap<String, String>) -> Result<ActionsAndXsid, GrokClientError> {
  let mut action_script_path = None;
  let mut script_content_1 = None;
  let mut script_content_2 = None;

  for (script_path, script_body) in scripts.iter() {
    if script_body.contains("anonPrivateKey") {
      action_script_path = Some(script_path.to_string());
      script_content_1 = Some(script_body.to_string());
    } else if script_body.contains("880932") {
      script_content_2 = Some(script_body.to_string());
    }
  }

  let action_script_path = match action_script_path {
    Some(action_script_path) => action_script_path,
    None => return Err(GrokClientError::ScriptLogicOutOfDate),
  };

  let script_content_1 = match script_content_1 {
    Some(script_content_1) => script_content_1,
    None => return Err(GrokClientError::ScriptLogicOutOfDate),
  };

  let script_content_2 = match script_content_2 {
    Some(script_content_2) => script_content_2,
    None => return Err(GrokClientError::ScriptLogicOutOfDate),
  };

  let actions = ACTIONS_REGEX.captures_iter(&script_content_1)
      .flat_map(|captures| captures.get(1).map(|m| m.as_str().to_string()))
      .collect::<Vec<_>>();

  let xsid_script_path = XSID_SCRIPT_REGEX.captures(&script_content_2)
      .map(|captures| captures.get(1).map(|m| m.as_str().to_string()))
      .flatten();

  let xsid_script_path = match xsid_script_path {
    Some(xsid_script) => xsid_script,
    None => return Err(GrokClientError::ScriptLogicOutOfDate),
  };

  Ok(ActionsAndXsid {
    actions,
    xsid_script_path,
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
  use crate::requests::index_page::parsers::script::parse_script_actions_and_xsid_script_path::parse_script_actions_and_xsid_script_path;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // manually test
  async fn test() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let page_and_scripts = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
      cookie: &cookie,
    }).await?;

    let result = parse_script_actions_and_xsid_script_path(&page_and_scripts.scripts)?;

    println!("{:?}", result);

    assert_eq!(1, 2);
    Ok(())
  }
}
