

/*
class Utils:

  @staticmethod
  def between(
    main_text: Optional[str],
    value_1: Optional[str],
    value_2: Optional[str],
  ) -> Type[str]:
    return main_text.split(value_1)[1].split(value_2)[0]

class Parser:
  @staticmethod
  def get_anim(html:  str, verification: str = "grok-site-verification") -> tuple[str, str]:
    verification_token: str = Utils.between(html, f'"name":"{verification}","content":"', '"')
    array: list = list(b64decode(verification_token))
    anim: str = "loading-x-anim-" + str(array[5] % 4)
    return verification_token, anim



self.verification_token, self.anim = Parser.get_anim(c_request.text, "grok-site-verification")
self.svg_data, self.numbers = Parser.parse_values(c_request.text, self.anim, self.xsid_script)

*/
use once_cell::sync::Lazy;
use regex::Regex;
use crate::error::grok_client_error::GrokClientError;

// <meta name="grok-site-verification" content="iFlTOEJNfQZP1B6YMRf/zuj3eYFrKWi6eNUg5XvvpllTOw5TS82coZkeUBdiHxYr"/>
static META_TAG_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""grok-site-verification"\s*content="([A-Za-z0-9/=+-]{5,})""#)
      .expect("Regex should parse")
});

// {\"name\":\"grok-site-verification\",\"content\":\"iFlTOEJNfQZP1B6YMRf/zuj3eYFrKWi6eNUg5XvvpllTOw5TS82coZkeUBdiHxYr\"}]
static JSON_REGEX: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""grok-site-verification\\?",\s*\\?"content\\?":\\?"([A-Za-z0-9/=+-]{5,})\\?""#)
      .expect("Regex should parse")
});

#[derive(Debug, Clone)]
pub struct VerificationTokenAndAnim {
  pub verification_token: String,
  pub anim: String,
}

pub fn parse_verification_token_and_anim(html: &str) -> Result<VerificationTokenAndAnim, GrokClientError> {

  if let Some(captures) = META_TAG_REGEX.captures(html) {
    println!("Meta match 0: {:?}", captures.get(0));
    println!("Meta match 1: {:?}", captures.get(1));
  } else {
    println!("No meta match");
  }

  if let Some(captures) = JSON_REGEX.captures(html) {
    println!("Json match 0: {:?}", captures.get(0));
    println!("Json match 1: {:?}", captures.get(1));
  } else {
    println!("{}", html);
    println!("No Json match");
  }


  Ok(VerificationTokenAndAnim {
    verification_token: "".to_string(),
    anim: "".to_string(),
  })
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use crate::requests::index_page::get_index_page::{get_index, GetIndexPageArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::utils::parser::parse_verification_token_and_anim;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;
    let index = get_index(GetIndexPageArgs {
      cookie: &cookie,
    }).await?;

    let result = parse_verification_token_and_anim(&index.body);
    assert_eq!(1, 2);
    Ok(())
  }
}