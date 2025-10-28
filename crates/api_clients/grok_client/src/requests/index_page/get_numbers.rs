use crate::error::grok_error::GrokError;
use crate::requests::index_page::requests::get_index_page_script_with_client::{get_index_page_script_with_client, GetIndexPageScriptArgs};
use crate::requests::index_page::utils::parse_numbers_from_xsid_script::parse_numbers_from_xsid_script;
use crate::requests::index_page::utils::parse_on_demand_script_from_index_html::parse_on_demand_script_from_index_html;
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

  println!("Script link: `{}`", script_link);

  let xsid_script_body = get_index_page_script_with_client(GetIndexPageScriptArgs {
    client: &args.client,
    cookie: args.cookie,
    script_url: &script_link,
  }).await?;

  println!("Xsid Script Body:\n\n");
  println!("{}", xsid_script_body);
  println!("\n\n");

  let numbers = parse_numbers_from_xsid_script(&xsid_script_body);

  println!("Numbers:\n\n");
  println!("{:?}", numbers);
  println!("\n\n");

  /*
      @staticmethod
    def parse_values(html: str, loading: str = "loading-x-anim-0", scriptId: str = "") -> tuple[str, Optional[str]]:

        Parser._load__xsid_mapping()

        all_d_values = findall(r'"d":"(M[^"]{200,})"', html)
        svg_data = all_d_values[int(loading.split("loading-x-anim-")[1])]

        if scriptId:

            if scriptId == "ondemand.s":
                script_link: str = 'https://abs.twimg.com/responsive-web/client-web/ondemand.s.' + Utils.between(html, f'"{scriptId}":"', '"') + 'a.js'
            else:
                script_link: str = f'https://grok.com/_next/{scriptId}'

            if script_link in Parser.mapping:
                numbers: list = Parser.mapping[script_link]

            else:
                script_content: str = requests.get(script_link, impersonate="chrome136").text
                numbers: list = [int(x) for x in findall(r'x\[(\d+)\]\s*,\s*16', script_content)]
                Parser.mapping[script_link] = numbers
                with open('core/mapping.json', 'w') as f:
                    dump(Parser.mapping, f)

            return svg_data, numbers

        else:
            return svg_data
   */


  Ok(NumbersAndSvg {
    numbers,
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

    println!("{:?}", result);

    /*
    ActionsAndXsid {
      actions: ["7f09b4b48933c332d0ed2689be265eb736e75c76d9", "7fa957f192ada06e391443f7bcee666006d78d916f", "7f605b51836e8b9088638bb9991ed75227bdedefd2"],
      xsid_script_path: "static/chunks/0db7b1a346e93e5b.js"
    }
    */

    assert_eq!(1, 2);
    Ok(())
  }
}
