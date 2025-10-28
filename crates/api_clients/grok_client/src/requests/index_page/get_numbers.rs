use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::index_page::requests::get_index_page_script_with_client::{get_index_page_script_with_client, GetIndexPageScriptArgs};
use crate::requests::index_page::utils::parse_numbers_from_xsid_script::parse_numbers_from_xsid_script;
use crate::requests::index_page::utils::parse_on_demand_script_from_index_html::parse_on_demand_script_from_index_html;
use crate::requests::index_page::utils::parse_svg_paths_from_index_html::parse_svg_paths_from_index_html;
use crate::requests::index_page::utils::verification_token_to_loading_anim::LoadingAnim;
use wreq::Client;

// self.svg_data, self.numbers = Parser.parse_values(c_request.text, self.anim, self.xsid_script)

pub struct GetNumbersArgs<'a> {
  pub client: &'a Client,
  pub html: &'a str,
  pub cookie: &'a str,
  pub loading_anim: &'a LoadingAnim,
  pub xsid_script_id: &'a str,
}

#[derive(Clone, Debug)]
pub struct NumbersAndSvg {
  pub numbers: Vec<u32>,

  /// We selected one of four possible SVG paths (of length >= 200) by the animation index.
  pub svg_data: String,
}

pub async fn get_numbers(args: GetNumbersArgs<'_>) -> Result<NumbersAndSvg, GrokError> {

  let script_link = match args.xsid_script_id {
    "ondemand.s" => {
      // TODO: Not sure this is relevant anymore. Not a full or correct implementation of this branch.
      let on_demand = parse_on_demand_script_from_index_html(&args.html);
      let on_demand = on_demand.unwrap_or_else(|| "".to_string());
      format!("https://abs.twimg.com/responsive-web/client-web/ondemand.s.{}a.js", on_demand)
    },
    _ => format!("https://grok.com/_next/{}", args.xsid_script_id),
  };

  let xsid_script_body = get_index_page_script_with_client(GetIndexPageScriptArgs {
    client: &args.client,
    cookie: args.cookie,
    script_url: &script_link,
  }).await?;

  let numbers = parse_numbers_from_xsid_script(&xsid_script_body);

  let paths = parse_svg_paths_from_index_html(&args.html);

  let svg_data = paths.get(args.loading_anim.0);

  let svg_data = match svg_data {
    Some(s) => s.to_string(),
    None => return Err(GrokClientError::ScriptLogicOutOfDate.into()),
  };

  Ok(NumbersAndSvg {
    numbers,
    svg_data,
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
  use crate::requests::index_page::get_numbers::{get_numbers, GetNumbersArgs};
  use crate::requests::index_page::utils::find_script_actions_and_xsid::find_script_actions_and_xsid;
  use crate::requests::index_page::utils::parse_verification_token_from_index_html::parse_verification_token_from_index_html;
  use crate::requests::index_page::utils::verification_token_to_loading_anim::verification_token_to_loading_anim;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;

    let page_and_scripts = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
      cookie: &cookie,
    }).await?;

    let verification_token = parse_verification_token_from_index_html(&page_and_scripts.body)
        .expect("expected verification token");

    println!("Verification Token: {:?}", verification_token);

    let loading_anim = verification_token_to_loading_anim(&verification_token.0)?;

    println!("Loading Animation: {:?}", loading_anim);

    let actions_and_xsid_script = find_script_actions_and_xsid(&page_and_scripts.scripts)?;

    println!("Actions and XSID: {:?}", actions_and_xsid_script);

    let result = get_numbers(GetNumbersArgs {
      client: &page_and_scripts.client,
      html: &page_and_scripts.body,
      cookie: &cookie,
      loading_anim: &loading_anim,
      xsid_script_id: &actions_and_xsid_script.xsid_script_path,
    }).await?;

    println!("Final Numbers: {:?}", result);

    println!("\n\nBody:\n\n");
    println!("{}", page_and_scripts.body);

    assert_eq!(1, 2);
    Ok(())
  }
}
