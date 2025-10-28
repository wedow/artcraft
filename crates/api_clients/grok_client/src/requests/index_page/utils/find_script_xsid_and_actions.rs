use crate::error::grok_client_error::GrokClientError;
use std::collections::HashMap;
use once_cell::sync::Lazy;
use regex::Regex;


static ACTIONS_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"createServerReference\)\("([a-f0-9]+)""#)
      .expect("Regex should parse")
});

static XSID_SCRIPT_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""(static/chunks/[^"]+\.js)"[^}]*?a\(880932\)"#)
      .expect("Regex should parse")
});

pub fn find_script_xsid_and_actions(scripts: &HashMap<String, String>) -> Result<(), GrokClientError> {
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

  let captures = ACTIONS_REGEX.captures(&script_content_1);

  if let Some(captures) = captures {
    for capture in captures.iter() {
      println!("Actions Capture: {:?}", capture);
    }
  }

  let captures = XSID_SCRIPT_REGEX.captures(&script_content_2);

  if let Some(captures) = captures {
    for capture in captures.iter() {
      println!("XSID Capture: {:?}", capture);
    }
  }

  /*
        actions: list = findall(r'createServerReference\)\("([a-f0-9]+)"', script_content1)
        xsid_script: str = search(r'"(static/chunks/[^"]+\.js)"[^}]*?a\(880932\)', script_content2).group(1)

        if actions and xsid_script:
            Parser.grok_mapping.append({
                "xsid_script": xsid_script,
                "action_script": action_script,
                "actions": actions
            })
   */

  Ok(())
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;
  use crate::requests::index_page::utils::find_script_xsid_and_actions::find_script_xsid_and_actions;

  #[tokio::test]
  #[ignore] // manually test
  async fn test() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let page_and_scripts = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
      cookie: &cookie,
    }).await?;

    let result = find_script_xsid_and_actions(&page_and_scripts.scripts)?;

    assert_eq!(1, 2);
    Ok(())
  }
}
