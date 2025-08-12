use serde::Serialize;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;

use wreq::Client;
use wreq_util::Emulation;
use crate::client::midjourney_hostname::MidjourneyHostname;

pub struct SubmitJobRequest<'a> {
  pub prompt: &'a str,
  pub channel_id: &'a str,
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
}

pub struct SubmitJobResponse {
}

pub async fn submit_job(req: SubmitJobRequest<'_>) -> Result<SubmitJobResponse, MidjourneyError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let referer = format!("https://{}", req.hostname.as_str());
  //let url = format!("https://{}/api/app/submit-jobs", req.hostname.as_str());
  let url = format!("https://{}/api/submit-jobs", req.hostname.as_str());

  let mut http_request = client.post(url)
      .header("cookie", req.cookie_header)
      .header("Referer", &referer)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "*/*")
      .header("accept-language", "en-US,en;q=0.8")
      .header("content-type", "application/json")
      .header("priority", "u=1, i")
      .header("sec-ch-ua-mobile", "?0")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin")
      .header("x-csrf-protection", "1");

  #[derive(Serialize)]
  struct F {
    mode: String,
    private: bool,
  }

  #[derive(Serialize)]
  #[allow(non_snake_case)]
  struct Metadata {
    imagePrompts: u8,
    imageReferences: u8,
    characterReferences: u8,
    depthReferences: u8,
    lightboxOpen: String,
  }

  #[derive(Serialize)]
  #[allow(non_snake_case)]
  struct RawRequest {
    f: F,
    channelId: String,
    metadata: Metadata,
    t: String,
    prompt: String,
  }

  let body = RawRequest {
    f: F {
      mode: "fast".to_string(),
      private: false,
    },
    channelId: req.channel_id.to_string(),
    metadata: Metadata {
      imagePrompts: 0,
      imageReferences: 0,
      characterReferences: 0,
      depthReferences: 0,
      lightboxOpen: "".to_string(),
    },
    t: "imagine".to_string(),
    prompt: req.prompt.to_string(),
  };

  let http_request  = http_request
      .json(&body)
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();

  if status == 301 {
    for (name, value) in response.headers().iter() {
      println!("- {}: {}", name.as_str(), value.to_str().unwrap());
    }
  }

  /*
  {"success":[{"job_id":"de5283c5-008f-4c82-84e5-4ba62cbaa474","prompt":"prompt","is_queued":false,"event_type":"diffusion","flags":{"mode":"fast","visibility":"public"},"meta":{"height":1024,"width":1024,"batch_size":4,"parent_id":null,"parent_grid":null},"optimisticJobIndex":0,"personalization_codes":null}],"failure":[]}
   */

  let response_body = &response.text().await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  println!("{}", response_body);


  Ok(SubmitJobResponse {})
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;
  use crate::client::midjourney_hostname::MidjourneyHostname;
  use crate::endpoints::submit_job::{submit_job, SubmitJobRequest};

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = submit_job(SubmitJobRequest {
      prompt: "a corgi playing cards on the Santa Monica beach",
      channel_id: "singleplayer_f8a57ac3-e416-4dd4-9be8-2c4223691b01",
      cookie_header,
      hostname: MidjourneyHostname::Standard,
    }).await?;

    assert_eq!(1, 2);


    Ok(())
  }
}

/*
def submit_job(
    prompt: str, cookies: dict, channelId: str, api_base: str = "www.midjourney.com"
):
    headers = {
        "cookie": "; ".join(f"{k}={v};" for k, v in cookies.items()),
        "Referer": f"https://{api_base}/",
        "Referrer-Policy": "origin-when-cross-origin",
        "accept": "* / *",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "content-type": "application/json",
        "priority": "u=1, i",
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrf-protection": "1",
    }
    body = {
        "f": {"mode": "fast", "private": False},
        "channelId": channelId,
        "metadata": {
            "imagePrompts": 0,
            "imageReferences": 0,
            "characterReferences": 0,
            "depthReferences": 0,
            "lightboxOpen": "",
        },
        "t": "imagine",
        "prompt": prompt,
    }

    response = requests.post(
        f"https://{api_base}/api/app/submit-jobs",
data=json.dumps(body),
headers=headers,
impersonate="safari",
)

if response.status_code == 200:
data = response.json()
try:
job_id: str = data["success"][0]["job_id"]
return job_id
except Exception as e:
print(data)
return None

else:
print(response.status_code)
print(response.text)
return None
*/