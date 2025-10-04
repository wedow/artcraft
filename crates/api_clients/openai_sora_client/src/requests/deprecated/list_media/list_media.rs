use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::utils_internal::classify_general_http_error::classify_general_http_error;
use log::{error, info};
use once_cell::sync::Lazy;
use serde_derive::Deserialize;
use wreq::Client;

//const SORA_MEDIA_LIST_URL: &str = "https://sora.chatgpt.com/backend/video_gen?limit=50";
const SORA_MEDIA_LIST_URL : &str = "https://sora.chatgpt.com/backend/v2/list_tasks?limit=20";

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
  
  // There are many more fields [...]
}

/// Note: this request only requires a valid bearer token, and it doesn't require a cookie payload at all!
pub async fn list_media(credentials: &SoraCredentialSet) -> Result<ListMediaResponse, SoraError> {
  let auth_header = credentials.jwt_bearer_token
      .as_ref()
      .map(|bearer| bearer.to_authorization_header_value())
      .ok_or_else(|| SoraClientError::NoBearerTokenForRequest)?;
  
  let cookie = credentials.cookies.to_string();

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| {
        error!("Failed to build HTTP client: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let response = client.get(SORA_MEDIA_LIST_URL)
      .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0")
      .header("Accept", "*/*")
      .header("Accept-Encoding", "gzip, deflate, br")
      .header("Accept-Language", "en-US,en;q=0.5")
      .header("Cookie", &cookie)
      .header("Authorization", &auth_header)
      .send()
      .await
      .map_err(|err| {
        error!("Failed to fetch media list: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  if !response.status().is_success() {
    error!("Failed to fetch media list: {}", response.status());
    let error = classify_general_http_error(response).await;
    return Err(error);
  }

  info!("Successfully generated bearer token.");

  let text_body = &response.text().await
      .map_err(|err| {
        error!("sora error reading media list text body: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let response = serde_json::from_str::<ListMediaResponse>(text_body)
      .map_err(|err| {
        error!("Failed to parse media list response: {}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, text_body.to_string())
      })?;
  
  Ok(response)
}


#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::sora_jwt_bearer_token::SoraJwtBearerToken;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Don't run in CI. Requires valid cookie
  async fn test_list_media() -> AnyhowResult<()> {
    //let cookie = "__Host-next-auth.csrf-token=ef2192abb44aad120d2bd0c67ffa156661b3a971274bebd5822bdfb45d414c38%7C05f5966f7a8c00637388b2c135eded2502ff7af04f986513354123f2fac31a24; __Secure-next-auth.callback-url=https%3A%2F%2Fsora.com; _cfuvid=oD_JCwm5zaQGmsQIy4XjzEoGM276yori_BR0EOBEEFc-1746571084534-0.0.1.1-604800000; cf_clearance=jHTsbECz4hIp7a7acOilpM5iKqbRCOcCMIiy664dbPo-1746580754-1.2.1.1-xNvHlmDlSKGCbed79EyntnpCU7U.dpI9qyVYYEW0HuXT5YKQoWEepQVbB8wMEWB0MtXemxts5SfVHYhY67uESdyN7yIrEP2LPiQ0L1tTdsjFoOvsJGURGdqRAiUF8sjqCdJ1Gfx8FpGfbmJUUYh1I.wV3c5e4zcw2M7Xs2iW6wSA4kvmuwZDXj7H4oPgInwhp_XVXa.jKPHPnNIMRoGR7dirbYhY6wcywUk53Uw4j418ml2Bb_93LWlhzVO6WVPfjnKvWc7vxw1_cutXLy.IqClatx17HXzbCISOVgOcDeGITvvVgbl5OTmXbBlGXtmaJlxtfjsFbxHJFgX93zFYq7pt9znzbM4DPNSO57A0eP0; oai-did=feeb4ee9-615d-451b-91d6-35c9b9ca9826; oai-sc=0gAAAAABoGrUiAr4TfGAcKlXSjhT1h5_5UYzixku3R9aaTwvYNKk4lKP_Yk1OzPWjJL0J1CwOzC2Jb17t3aRDM3z8kxH1WOAZhIdnTU_u2NBgkfQNUQhzMBR_Qb5xHkfJ4PFUpwO9n7YNDtSoN8QVP7U2hbi0GJfMA06k0kcaceUmTvbEK6Uceq5R13QVhTPfZC9JdEjcgXorTcq7iQW9mQPJYfVhUwKgWbtdXgwQROAM51Zq4ETutVYZklPhaXy0hHs1LZdM0GRd; _cfuvid=tYpYCaVU3akRC7xqJ9HhgKb45yUMSDkSkk6zoY7wxbA-1746571091829-0.0.1.1-604800000; cf_clearance=oAW.3k9.ail0y7zwjDtsUlJIC0OAd5NllKMUq7r6T7o-1746571092-1.2.1.1-N0zV9i8bumZPfGDsB3TBpE5dIoU51SUzUvjsycWn8GmGHo6v_M6EeuCIEg9OIfAJEeJWNvE6mf6v0wOZ4x2FrUPBEc06NfnQgVb9fkIE5vzUsukkPX7jK1pigl7vtSiqDmFKyvcg4ojUUUEHuHPZeXDmiDE8UdHzLPSrMaANI6V7k5cflmlhnho8vgnFGpkiHfOArlfABVTkHWmTQo1pJAuQxhdSM3hMyxpA_6VHeQC_fUFX8Rk.dSwQzx7dCV_TCY5PKbOvfOd6X93sPSaQWneGo9hrDOTlZxeVEGLfpd7WngdKPS_fbjf6nDmwHnMtmKPMZsd_BLS.b3TfkmqngKPG_oZxWxi730a5NJv7O6w; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..UtJZGQCBDAEdkNRL.h7_eoTetqxFXGt6RmB8fr5JYaJPXH6vvcSMKG05JDGq5Nb3TSNXHfOIYdY5g_E-7xUgsPJnoE9RHmUZRuS1YCA0UW23cYmwHigGU89KKcdtJqg7rpcgosIQ2UTLY7aXe1WZBR8-3ACI-auo51JzMrjD7vnDL41k6UgGr7tdGoieyVxqlB58ughkcfIyneBm9k7VdSTahgD75BQRqWEtruPoAMCir5qtbu5bnDyAiCjT4S02gK-kVfgGlP5_tUTT_VoSQ-YMGE0Mw3Iae85l4X5PjuBj_3uhRlKEL6aABfs3KKr8gvsb6xGP_cypWVaTcPMpeFidLicJV4GTbj4x5ncGdJ4E9WK98j_fQRB6tQnF8op7UBuh1zOdKUFvmrKof4DgJm4ChPeff-kR_z64jRkZfiDdu7hTwEx1VIoIcXiVjBLg4MJAG_79WhETxiz61-HMrsUpNgRD3QSH6H6j4X3HpPs3hgiBZnd0L0WDOQU_mTcKBkvpm3Uubcatv5Gss797TelMs2cM7J64DDz88tMzChyMj1mBPguONIWlrj7G5pYkC9sLY5gyydZoK4cvfcxkAVgWa-UZJAtNwpf7XdYw9FutjW0Y5hucMqch3J2O51wVx6KltKjycLXGIJfFydq5qO53Ngu02WEz2AbBfHsdBqR2S-46t16LEqjCfWzJRuUOe0V_Ao4_lqVxgjc4Nd97pjaJhuHIFjWVY8GLmh5rqVUDAiDexEax7TLF8Htp6BBBdOt5-j772SbrvjCD8u06OyksGLIXElY66k4RMGsyzJLDxYoNa-c7E_38WtQJsPU2QH8kYRkwP8H_QYdYnOpukHVY-2Uv5AhAwaP2q9zqYAwPGyJ39mWQq0NrZ_rGqotRz9n_3W37Sbu1eX_5Ae0Vn33BuKG3fzxMU7akSVmA7_4DE_4dQC8PpmQ9C4UoLYhxg0aKCs4KVOWjpSTkLRoehiB-15R-SNHwNGKUMGoFg9B741jb8SHjgYsAVJnvj8VPPDhFm4r4rSqv-IIN--iebrj3ExC6YqBJmwWp-ZAvioSElJfvqZasoYkRKm0CjLoXuVawCcHVNngK0U0PjEFMKkveD9E4-MW2KO2uhud2OShZvXs4ge1Fvmk1yFwttmVM1f7MvSEoAolivtFj623iqlT-Sw0zTSg1Dw4-fDIfPk24r_eoaZvooP_r1sJ89NDDmPJDmZm_oavGdkP_2CCEEPaVNq8m72Mu2K2Le1geyvm8vepT9OR_5q3MDypRqs4KLruzrSqhfDr80Z0FMJHQGv-uyugY9yroX8GFtTBiXdIbRBiGquLgkOvjuw92JDTCT3HtMm5liFR4tGXbcsEKqp_HtK4cd1krKIphq71LKEhklkSXC-JvNzWS4qYEANdBrNfEaSa2e8-wtzW2qIuMfOZT4Cocv1H49cW7SIB1_5-DG3dy--1s0Wf6JniMn0Cprq9h01A1hraFxpSax3gAeOehYCLk3soPu1r0VlbXzdxTFg0S9AxeuXwj-IKL39C9gpQSkkeIsVeSL3VFlzYlpdupZcNbFLlp8JMoIlOnNaABBFPji12ln9dkeyEEkFq0JL4UyZLZ1SegADd0l7s_cn4dtYYfuIuAAJFC16vHDJ7UMVfVMhBeKA96U1w4ak-uKs8wk-l5EhGragNpPogCh_ccHyQf9zV3AnHbJyGsiVc1ztjNu6mduFB41FO3kQDBH2uoa2PgdgWtaO-zLSrTDns3aGffp6VWYddxuPvA3T5VQDVjVLz6eJ2_d2N0B9sPmevKkIYEaI1-OClY_StB4TG3VdNUsfcaqymweg43scS4DZBa9DPGz7ZmC-HG_z1oVfaoZGfa5-XD-u0Oyuu91xYM-QOuccvsHco2GWUTsf52qH51mLvkpc5AkaO9tUzhN0rQLabOGSUBjJZyxIFrRsLLlDWDwPSr3k7BbB1fBUvsUiPShqI_CWKJjfqsEiHjrt3MbfcbLc12XqYuvrCHwtpi0JRP67TwnUKADP7SEP0FEdXz34prhXpJSvK49hmpUkKYCbsdntJFz4J6vB7BKLcb9B6MsWNH5N14yhn35UJZc7_IToLLnjG93KcOhSWNvXtP9vTXRVmxIJtYfnZOOI6wsTxZ3WQcAypxYA1PLzJzlVrZC2TkT9Jhcph_Y2uHCKm0CFka2nr8DHF2VyrEo1n4x_bjXve_BZigWgGgFE0Vn4NEUdLislf0jTXcVhTwVCCxtYGPkKE3NTpu-Djl3HjPUGRYFC3dXa10HWJiazfOITTUO85LEpVRb9j2lhQaX9dKe6toPipSpGwzsdkOaw1liuADV9J8ssMSkhs0W_CLKd2HaJioPKUVUJ0v2B5Z39DiLyJ_NDx6vZoGzO8bRUp2Atm_z3ccrsaKuO-brZBmG_gApoXLQXdBPwovyS36TXx0fcdqcFlH5yqADtK1Yn9Zjkp5gIzbPz-k8nUtBtu4_JOayzFJpWGheTrkoj-nBIvuOfQB1yJan9BVZPF-KzALb1JdTC28k0kK60Exf7r2lulwA_3_-Ydg8inZ1HHGUYouAb6Na1r4Pk70g4waTzLItIbDPOeATPfvV9xRJ7LT8Yq-pbfIg1rHKRjrCcQ8IeonjziGxfNnFiPy4ANLtg2F4Z_dwi0BPE9MFo0yO7gKELGGpGoOB4rcd8mCK_wnm6MyBbdqC5oftova8ymTqjqNEH24L9DwCk8F_jx8DJhPvgrOnMU0Gc691Ym5uQeF_aMwtn6AaauBVr2Qf8VBE89wz1-sxk2vI4nJQasW9Q8wanqw_pSxwMoc1XzG8MY2sNRRREt1Ex1nmR4HjVdDSYJmbnqYgREPiJ6zUTcJkNJDPQjo70R1TEVjV8v0a97Ca_Fijp8CG2ZcD4VIAM8kOF90RJlUeG74pCIscB6AGi7tmgcO9a5VdHfeeqomRlFKVN9Ipi255SZHpI8JiUaUGwpP71RE-JHo4baZ-g7Z6i_UJsh6-76LKwL3HWblb2shAazc5cqC-ySHohWfY6_zeFD02zeoVN5vr-SaoQjzywVfef9V4AS5cs8BqlIJYP6Lrzh2AC9GwtSpEw22NVT6rR4VAIbER1HuGbwnNmnCDwHaOoyzFwkVGU8uohlOG8QYPUnLLfl8LzKv2O6SLlwcdZA1Fxiftv_ziMA4qo9Q3NQ-bblDycx-oKMWzSAvbx4LrjYBOxVn-XErq7B7K_i2kkK1C9Ttf63zbemz0aPcdhXWiEnKArv-q3kj5y21FKlmI4TwZuTKV5xlu-mOfXXWmTZZysOT6my6xZXsNOa1N-LiigdU_NV6gYmzV1Pvk1dM4lyFjr2SM8jB6hA_Je4gyhMfwqdDlFNKRJGG5SYGylYGgrqoF9Q8P5ZPxy-rzmliE5nIYICZDRw4GixtjlXElu1-voa1qlO-jB64-Q1pjfpY6FYNBdtVjFYUiMoSdaH2qscS0x9y_TXH-qvHmrn0Rbr6HTcaUQWuFwB05o-hrqpqIXnhsYaFRFo9mIKqerSdYcXWV7vjt66yOBOJXGGMdeUKEiOhoEBRzMONTaGzyqnyREpKAGKGnnAoBxiDJAPJiU7Un0A.N3e3RwsHSx7RIyRpkArjhg; __cf_bm=.tgjY3xPUqb8neZ82V8alW6BUjaUjhl9AKSAVrWvCok-1746580754-1.0.1.1-O_ArZyOJreXvGtcaHIt1cvKmgvmfWHl09pqbT9ThwMTzN9eioOcPFJty1P.ubiZc.mnPMaJD3dRXzkhbHNYVBPuRgzmujyF5kvUs0hE6LJQ; __cflb=0H28vBjUqcdJN5F5i8D3tzftjvH7q1fnq8Q2Zh98qhf; _dd_s=rum=2&id=a8178f5f-ae08-4826-bb1d-587e16634b15&created=1746580754683&expire=1746581708921; __cf_bm=.17Mcz2Tr68P5cveYebWZwneOqCeN0Mu3Ad_vzuw5hk-1746580754-1.0.1.1-go.48gAjI1dOIK3MfpLAfmz43EA.5_Wh.fxObP8M58fbQPeP_72H0dqO20Ei0At3Z5RqbNqS8GED9zvJ1utsNqmWHJLtgG58fLvIwcXkgTI";
    let cookie = "";
    
    let mut creds = SoraCredentialSet::initialize_with_just_cookies_str(cookie);
    
    let bearer = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE5MzQ0ZTY1LWJiYzktNDRkMS1hOWQwLWY5NTdiMDc5YmQwZSIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSJdLCJjbGllbnRfaWQiOiJhcHBfWDh6WTZ2VzJwUTl0UjNkRTduSzFqTDVnSCIsImV4cCI6MTc0NzQzOTIwMiwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InVzZXJfaWQiOiJ1c2VyLTZOeEpmbEFIb0VCREp6Wmw5aVhocWJERyJ9LCJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJ2b2NvZGVzMjAyMEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImlhdCI6MTc0NjU3NTIwMiwiaXNzIjoiaHR0cHM6Ly9hdXRoLm9wZW5haS5jb20iLCJqdGkiOiJiYzM3NjgyYS1iZjJhLTQ1MmUtODFiMi1hNDRhMzY1ZGMzZTIiLCJuYmYiOjE3NDY1NzUyMDIsInB3ZF9hdXRoX3RpbWUiOjE3NDY1NzUyMDE2NjYsInNjcCI6WyJvcGVuaWQiLCJlbWFpbCIsInByb2ZpbGUiLCJvZmZsaW5lX2FjY2VzcyIsIm1vZGVsLnJlcXVlc3QiLCJtb2RlbC5yZWFkIiwib3JnYW5pemF0aW9uLnJlYWQiLCJvcmdhbml6YXRpb24ud3JpdGUiXSwic2Vzc2lvbl9pZCI6ImF1dGhzZXNzX2M0VXcyZWZUVE0xT0ZBZkFoTml0ck43dCIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTEzMTAxOTY3NjEyMzk2NzkzNzc3In0.JPi0OSP8T27JM_hYffctiWN2MaVVNzE-kQxbhgdHFhrirjQvNdIAfYbP5764-_3UhtM-waNNsLPx3rjTwHuDxC9319axCpCDvNJg55JZMEW-4r-juUecGFoF9VS3w57Znt3mXAk3LyB0adoGZq3Hs6Za6bqrTVyyil24iIj1kEapK0uiDKf4jW_YKR5R3ZV4igZoOAMglKSEIiQ2oR2yGLEj0Omi6XF8awe8RQ1IlAkvv-67fvUIFHU9lBHvRFgv6ktEUJSIz9FOCUADgGTUKhqXyvlT1xVeMcjifi0xpks39gmLcGhygVGsOHLf2j7DRCuSuYDd8_xqtsg_Qc58iMHwWuEIRaoPiTN_PMkT4gncmou7PnoUgRQMlpojGwMH8fyRSYsgFcg0wC0Q7QWlZvZCEMt_w8jhXk1Hn8k0wIKWH0L5v2PN6i1oDVjfXPXDq9X0Mp1vqgMwal_LOwsKB93SNHdtvzUD0ZCq9Nhr-eW-6xOF1YT9g5j3-Dk7cm97lJjmYlDEYBlDGCC34D5IBlZJy2H3Ojl68Ff3DYGsWsDiAidYAmoj2rUXio3got06l81L45ddXayrqMA9BizwmXjReJcnZZm7sCGSYTOBY5PeAo_I0i-TZe7sXoFppsO78KozLVrtfoCa6hUPlX0psJJbnbaI_IJualCuByR8gxg";
    
    creds.jwt_bearer_token = Some(SoraJwtBearerToken::new(bearer.to_string())?);
    
    //let _updated = maybe_upgrade_or_renew_session(&mut creds).await?;
    
    let results = list_media(&creds).await.expect("should work");
    
    println!("{:?}", results);
    
    assert!(results.task_responses.len() > 0);
    
    Ok(())
  }
}
