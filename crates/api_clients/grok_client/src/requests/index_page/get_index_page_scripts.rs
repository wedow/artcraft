use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::index_page::get_index_page_script::{get_index_page_script, GetIndexPageScriptArgs};
use log::error;
use std::collections::HashMap;
use wreq::Client;

pub struct GetIndexPageScriptsArgs<'a> {
  pub client: &'a Client,
  pub cookie: &'a str,
  pub scripts: &'a Vec<String>,
}

/// Get javascript that we'll need for client crypto purposes.
pub async fn get_index_page_scripts(args: GetIndexPageScriptsArgs<'_>) -> Result<HashMap<String, String>, GrokError> {
  let mut map = HashMap::with_capacity(args.scripts.len());

  for script_url in args.scripts {
    let result = get_index_page_script(GetIndexPageScriptArgs {
      client: args.client,
      cookie: args.cookie,
      script_url,
    }).await;

    let script = match result {
      Ok(script) => script,
      Err(err) => {
        error!("Error fetching script: {}: {:?}", script_url, err);
        return Err(err);
      }
    };

    map.insert(script_url.to_string(), script);
  }

  Ok(map)
}

#[cfg(test)]
mod tests {
  use log::LevelFilter;
  use errors::AnyhowResult;
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::requests::index_page::get_index_page_scripts::{get_index_page_scripts, GetIndexPageScriptsArgs};
  use crate::requests::index_page::utils::parse_scripts::parse_scripts;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use crate::utils::create_firefox_client::create_firefox_client;

  #[tokio::test]
  #[ignore] // manually test
  async fn test() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);

    let cookie = get_test_cookies()?;

    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let scripts = parse_scripts(&index.body);
    let client = create_firefox_client()?;

    let scripts = get_index_page_scripts(GetIndexPageScriptsArgs {
      client: &client,
      cookie: &cookie,
      scripts: &scripts,
    }).await?;

    for (k, v) in scripts.iter() {
      let mut body = v.to_string();
      body.truncate(100);
      println!("{}: {}\n\n", k, body);
    }

    assert_eq!(1, 2);

    Ok(())
  }
}
