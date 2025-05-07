use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::requests::upload::upload_media_http_request::SoraMediaUploadResponse;
use crate::sora_error::SoraError;
use crate::utils::classify_general_http_error::classify_general_http_error;
use log::{error, info};
use once_cell::sync::Lazy;
use reqwest::{Client, Url};
use serde_derive::Deserialize;

const SORA_MEDIA_LIST_URL: &str = "https://sora.chatgpt.com/backend/video_gen?limit=50";

#[derive(Debug, Deserialize)]
pub struct ListMediaResponse {
  pub task_responses: Vec<TaskResponse>,
  pub last_id: Option<String>,
  pub has_more: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct TaskResponse {
  /// Task id (eg. task_{foo})
  pub id: String,
  pub title: String,
  pub user: String,
  pub created_at: String,
  pub status: String,
  /// Text prompt that generated the image
  pub prompt: String,
  pub r#type: String,
  pub height: u32,
  pub width: u32,
  pub operation: String,
}

pub async fn list_media(credentials: &SoraCredentialSet) -> Result<ListMediaResponse, SoraError> {
  let auth_header = credentials.jwt_bearer_token
      .as_ref()
      .map(|bearer| bearer.to_authorization_header_value())
      .ok_or_else(|| SoraError::NoBearerTokenAvailable)?;
  
  let cookie = credentials.cookies.to_string();

  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(SORA_MEDIA_LIST_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "*/*")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Cookie", &cookie)
      .header("Authorization", &auth_header)
      .send()
      .await?;

  if !response.status().is_success() {
    error!("Failed to fetch media list: {}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  info!("Successfully generated bearer token.");

  // Parse response
  let typed_response = response.json::<ListMediaResponse>().await?;
  Ok(typed_response)
}


#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
  use crate::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
  use super::*;

  #[tokio::test]
  #[ignore] // Don't run in CI. Requires valid cookie
  async fn test_list_media() -> AnyhowResult<()> {
    let cookie = "oai-did=bb449d6b-e6d1-40c8-b5eb-972b110a0918; __cf_bm=JqXYK3aRe_0KZb8vsSijTm2YJvpDV33oyEQpfcKKKKI-1746570472-1.0.1.1-eMi1cn_XDBxJ2u_UqGql0BS5lC5FXwSxZCYjq2FR_AL38LBllAuKbWS93THhE5wjn3YwGhifW2fa0pAFEHIV3eZIZuH5oFSb.aWOqmtYEsw; _cfuvid=KbIJVncxt0WZo2fG_tci8JjgnxJBfcL3SxlLeP9OHE0-1746570472074-0.0.1.1-604800000; cf_clearance=mlWui.52Enn_gRDTISC4Lx8j.UcsRlKo2dfFd15bzKw-1746570472-1.2.1.1-MblVM7BHYxZoTmR15yY_dEyQhQJQgA4boTjDv25pG7MqKAOKh2QwH_8QHG2er0mTxrOfzOkKFwYpKD.DPV7fPp0fUIGVmoi.WwDVChrwdsH8kgnMP3g6w19TT5qmgHc9gMmpjsoop0mRjPbmPEY0lrKvobTvXAclTdPU87dBkQgaMQbFb5M4qDSi3XN2r.0aYhbTLdN0ypR3mx9Jl3Oil5HThUGNSy8rhqDis3TwtaoWu7GoeaXd16ubHX6vmEMnP1UZJUupE70WcfxSSGDMRcpkjePOjsHpbTuxDGziEdHHwODhQlrriXCp_LTZuCwiOPWNyiJSHEbZSFieW5s02S3J4smBp6qpSH_MMQgAh.0; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..DhbnG188knzLnuC5.yyYzvDaawyv5penH9KFwivcPeEuVX1xkaIAKGhT0aeW-e2B1lqVK8uiHmOpba6RNsBuJSrJ3zGljBrCwGeeD_vCLye53SH_1wqUHg3BrsPbGFozslPHr6HBDM2RF4fMYb-wNxuHoCb3QcRfZWGQbaxwoOlL3MlUt_ZZ90kH-_Kut3tGhWM82d7x2YSJiV0Bgci9AjkNPNqKQtod9q1_MCmW7E0Hos-09CR__sGp6GUBsdMHR64V8zDbEpg6nFU0--6p7kFoJ3FidbXGyiMlqeMi_rrr3Od03S2tbUJSTUguxA0y8SnwpPZ9oliQ1Gort-EbRRnUYG5VvyxMptiJXmhnz0AJ6Ey8d4BY9WtnMo9HcOm1wUF_7tZ14oTZVdtn6oFIQvo9xSa4aoV19XlvMCifYyYnqtOS5CYq5xzmu3BUJvfzsBIafKhAaRlQg8uyI9zaYZ3JpXx0Aa_8MGuUcOuDPksoaFRHYiy_UoPPzDDJBCGd9ymiBS9CE5TsXbBPE01IkvF32nWAaC3_HDUp_qEpksP5WNA29akLUFBjYL1WXU2aeGmDHSeDqwwI_2kzzga6TPibj1HDRXxfuJPf58cYtZ0jIjLYAA77LgQ59QGInRQRr6rN2TlbEf89Onkv0NWRBqXzZMu3qr0cj17m1Smq7HaLCgcRJSGdGR2LVKZpcZl2V0EuktLQumVgmZLSvcKqpyCk-zZkGRtLBqMpnsSGa4uC8wonoejGt8y6TQSdjPoTTWDynjEH48bFF_aXLIxqF4W_DzE5M7ymQ31PdxKQ1Rkxq9A2v_igOAAb1uN5oE8TGcFGM1aWpuqX6fEKsNMS-hUitTq6aase64uSEXUWWTMFKwSNhJCGOIo1p3zsfznjAxSYsEUYy0LiVPv7SpiDCcYsIsFxZ0QksS9i3CcuFKCqWPRNkSR_F0B2juQEiAVTHBD7ugbg0j8D2y68xGNMR-HrNBHld3k1LrA3pkz1m28dcllhL-NhZ9Izm98kvY1Sj3uGP97d9_Q7QG0ce_93xXPDSKhrV_eTV_BKkUSNN4uUBHm2kYiHK3_SOfNUlFHEGa7ANiiNhOwWGzj_lAeAbN9Ab6FEPvgyPQS0BEXDRu5tey-c2KVPZJjOWReS_ZUBXEy7fNCRAH5zsO1EeD3cjlv2MIH-Gupp4YqeZWW1QJPvFIlHqTBLvturXx9lteYxweeWH1wWedr-jbJfjp1csSF5E46WuW6MjfNPWNBYCiBg_Al3876mrAvag62bRgptUFpZ2m_VWVdENA_rhyL5ruyyIoKF6war6_y0oGlpPY_AULFeK0-thWtt2zB_kGgNt8HblwnskOvta1k1xZt9oXTMG9dlnlVLn-155VEbWnMF8wtFYcT7By_Fpu_BfCVyjdg70qk8YoibUnk0Jv7L2GHfmlPejQlhfX_xZiZ9zjC80Gs-jnQyV5xG_7IAUqYZ6BrCzGXyk0ZVLKC-gGWAN_ly6N5Rs1G-X2bEGRmE-Kv8JcvSyK3ye3T02ymOzIml0qt37RGNzOLry0cPi0GVr1boeYAJmJdBpT9w5PvuoXmnoMF5yhIVfA3jIxnNjJ7vkUaLOsKT13KOKtpEA0nuUALyJ4UmIQLZtD0j8xXgMsBolDTnt5LRbS43PrvfhtKm9l0rnBJ2Ruja-gOhUmCogwitZlfmrwJGa-2hf225nMr2L0u6biBaETWFwOQ-EEseOENEhqTbygTmdDMwl7iMbFbn4bgtj3N9tpfO-mua_e0oNWInEYvrT93qIKl7UIZegoxqWhN9cMbjsHd2I5PJF-ES96tfuVDYgoo0wQ5ZY61ZbNOh04lqy7TDYjLJ-YfXy01rU5z8X3O0sS1lg636fJbpJymYhrrCMpzfNMaw3veRdTTUzcLnLfakAlB1Rv7ouLX3XJ76cUO1PezX2ukTNDaMz5ls5b8OTFh7XnOTYT08nKHZOXj7w3_udrgPvLr7YZAf17N6BosQ6FZu-AyBtIZtZwaZR24JrBypo0Ny0pc2erMjEn35q2UgB1vgyhLADfvV2qzZwNSw2ziwFyMKdw_XE5ZgapKW-x3kEwhQJw2-B1sJcJqg4uf4GZcDUE5odvDAMtbziTX6b43VM6nVUlCTRXNznwt-NQ-kWoCSEna90AtJNgBbBzZ0BXPVNyps9B7lwNF9iQukF063pVEzwReYBjlqkSMxTSU54yN1TLWdhYqgg_4BAQsXsCdZw9PwY5n8vk3j6JI4LSiFPHUI_Lok3hNHK0gV4wdOgdoLTing4iHWRyq12ZVyS3p0PeCKNKLP1ZMePG6pW90GlBo1QdL3AbukJOITy-n102UFa1udb0GHtOfjQVzDGQ3hhUmka04H0-LexyfEi1Ee0HijvQFbMaWF4-Uzpzlu4__u0PDD9Kzxhw66NGFMaDxKxAYXiXEcsmxH_ptQPHOz_i5A5mNeKCFoeSl898T0mxPg4DRwB-R7aRzHgnUiputdJ2x5TAsQsMWB4XqfAVJqEe0ORNXvzezRPKiL1gCif1tyQj6acm1Hull78zPYvzNC76p3srFW2Ohg7W3tM0ODuLLx7E5tnmzAhnIWy_fkdcJIV8gvommNkBzaGWut5c_h_f6sP4WgIAgBi6Z60YSjMaflD6bRQumHcZl1dMi8Gv7j5BDPo7-phJIqpLc1uYzxMZ-IoAcSCSvmhh8cwsqONDj9muvflfYAISA8UL2ZVlRnHI_l6E0I8RXiXWt59u_UeAv9FdRtcmoQ85wa5axtUaJ19RkpmPygiH-A3xNB0EhwfOgI6OOrJL8L7EWDVJhViSYYCGVW5ZVOGsYyT7wKHqIxbrM18TJkJ4XJuHC9rUowmWLkq2xkbfmRpUQIMrvyB8HBaWmkTA5rZnqkYJDr4Avm4SOltFX1g4Dv-ediVZRtCMPYz37olezdDfBqPchQfYWbp4Bnd5Uy_Z6Rs3ciF2-Z0HUpF2i6FxezCIR7r60QRoWah84PS_2-_7hfhQyWUoQEuqwntI9y2jp77bWULIaU81g0r66_Q8KSSdwnxmIFk0OmhQCUN4Bsh63UDyGQ0AKII29QXY7lQU8E0kAyfyL2kTthsIdo4r6ilMQU9aZVJUC2Om7wAfQjZBYzyWNHdphyboGmSb5J2uKxPhE-whc87ZSfJ2aiQ4FiWu112SpjZSQ1pmrM7NDUtsKYZeUvZ85LoSKmgwz7oy2PaW5q786s_nAKVDAHTy5JeZbtWN3pI8CGA9kJakz1axsTBis_W8aJ3kRUyxgUFAJZ4C0HukYxzr8kvL4e5gjKF0-EvzWmN7TIWV03kzbh1-vg7X_gUsijHL-SCDaZMKqOz146zVIIpS-xNjr-7lBfS-AxciI6JPlncTgLntTxfuoP2QavSBc4PZ_Fbn_Ko1UxvQQhJgWYkoBH2hUpIvObn_BaeT2PLbVcht4GhUgjwkDxpV14u1RLDqyqOyXRyVqTVO3wDtmSefrMRWze0Q2D-XW5JUAHOjvuU-AQ4MdIV9LiVlQAOjlIx5e56mVWXshjmcCNaG1vHo62yLZj5Iz0kf7SjQZ-WZEzDbpPXUeAEsCANQDB92l-sRUVTdg.DlCfPqTSppBQoodvYnNh7w; oai-sc=0gAAAAABoGoz4VyDlu57UUFNU7plsIHZekd0cT9h36pzM5uCs1hG7R9NaGclCm7hpLmaftSFPPd8EMNOHKFfjF2XMwpdhCCtYVv8N9FQUwCoC49u7I5rS6ozwDiBur0tlCduiWNhx8N2w4onMd3F1EOJpVLheW9XNY23elJ2-3ZcX-3WFvdPIrQdpgI0PRjXuEyPNcGF3IBOsELHuy5EqCww2SibjLF1yFDtua06RUtACm4J9ma1pHGTzCqVUo91FCQi4F8ktbkVQ; __Host-next-auth.csrf-token=96efb8da024d1edf44c144394fac947b9350a05dbbe1fb7c62e72a0e1198b078%7C8cdcb6b83d18d8c4b0bf75b19e9178303fd51b89bbc543a1bbc875ce7bf1cf89; __Secure-next-auth.callback-url=https%3A%2F%2Fsora.chatgpt.com%2F; __cflb=0H28vzvP5FJafnkHxj4Jor5o3JpmAUGCcWNAeV5HsmV; _dd_s=rum=0&expire=1746571374067&logs=1&id=3d0c4c67-870a-4724-9c41-3849e3df0bbc&created=1746570472537";
    
    let mut creds = SoraCredentialSet::initialize_with_just_cookies_str(cookie);
    
    let bearer = "";
    
    creds.jwt_bearer_token = Some(SoraJwtBearerToken::new(bearer.to_string())?);
    
    //let _updated = maybe_upgrade_or_renew_session(&mut creds).await?;
    
    let results = list_media(&creds).await.expect("should work");
    
    println!("{:?}", results);
    
    assert!(results.task_responses.len() > 0);
    
    Ok(())
  }
}
