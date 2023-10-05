use log::warn;
use rss::Channel;

use enums::common::sqlite::web_content_type::WebContentType;
use errors::AnyhowResult;

use crate::payloads::web_scraping_target::WebScrapingTarget;

const RSS_WORLD_NEWS : &str = "https://www.theguardian.com/world/rss";

const RSS_TECHNOLOGY : &str = "https://www.theguardian.com/technology/rss";

// TODO: This hasn't been tested.

pub async fn theguardian_indexer() -> AnyhowResult<Vec<WebScrapingTarget>> {
  let content = reqwest::get(RSS_WORLD_NEWS)
      .await?
      .bytes()
      .await?;

  let channel = Channel::read_from(&content[..])?;

  let mut targets = Vec::with_capacity(channel.items.len());

  for item in channel.items {
    //println!("\n\nitem: {:?}", item);

    let canonical_url = match item.link {
      Some(url) => url.clone(),
      None => {
        warn!("Skipping item due to not having a URL");
        continue;
      }
    };

    let maybe_thumbnail_url = item.extensions.get("media")
        .and_then(|media| media.get("content"))
        .and_then(|extensions| extensions.get(0))
        .and_then(|extension| extension.attrs.get("url"))
        .map(|url| url.to_string());

    let maybe_image_url = item.extensions.get("media")
        .and_then(|media| media.get("content"))
        .and_then(|extensions| extensions.get(1))
        .and_then(|extension| extension.attrs.get("url"))
        .map(|url| url.to_string());

    targets.push(WebScrapingTarget {
      canonical_url,
      web_content_type: WebContentType::TheGuardianArticle,
      maybe_title: item.title.clone(),
      maybe_full_image_url: maybe_image_url,
      maybe_thumbnail_image_url: maybe_thumbnail_url,
      maybe_skip_reason: None, // NB: None known for TheGuardian at this stage (yet)
    });
  }

  Ok(targets)
}
