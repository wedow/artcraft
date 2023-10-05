use log::warn;
use rss::Channel;

use enums::common::sqlite::web_content_type::WebContentType;
use errors::AnyhowResult;

use crate::payloads::web_scraping_target::WebScrapingTarget;

const KOTAKU_RSS: &str = "https://kotaku.com/rss";

// TODO: Rename foo_feed() or foo_rss(), etc.
pub async fn kotaku_indexer() -> AnyhowResult<Vec<WebScrapingTarget>> {
  let content = reqwest::get(KOTAKU_RSS)
      .await?
      .bytes()
      .await?;

  let channel = Channel::read_from(&content[..])?;

  let mut targets = Vec::with_capacity(channel.items.len());

  for item in channel.items {
    let canonical_url = match item.link {
      Some(url) => url.clone(),
      None => {
        warn!("Skipping item due to not having a URL");
        continue;
      }
    };

    let maybe_skip_reason = None;

    //// Lazy heuristic to skip CNN video articles, which contain little text.
    //// eg. https://www.cnn.com/videos/politics/2023/02/08/pelosi-gop-hecklers-reaction-joe-biden-state-of-the-union-tapper-intv-vpx.cnn
    //if canonical_url.contains("/videos/") {
    //  maybe_skip_reason = Some(SkipReason::VideoContent);
    //}

    // NB: I'm not using these as I had anticipated.
    let maybe_image_url = None;

    //let maybe_image_url = item.extensions.get("media")
    //    .map(|media| media.get("group"))
    //    .flatten()
    //    .map(|group| group.get(0))
    //    .flatten()
    //    .map(|extension| extension.children.get("content"))
    //    .flatten()
    //    .map(|extensions| extensions.get(0)) // NB: First image is biggest
    //    .flatten()
    //    .map(|extension| extension.attrs.get("url"))
    //    .flatten()
    //    .map(|url| url.to_string());

    targets.push(WebScrapingTarget {
      canonical_url,
      web_content_type: WebContentType::KotakuArticle,
      maybe_title: item.title.clone(),
      maybe_full_image_url: maybe_image_url,
      maybe_thumbnail_image_url: None,
      maybe_skip_reason,
    });
  }

  Ok(targets)
}
