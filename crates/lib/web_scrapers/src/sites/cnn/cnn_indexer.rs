use log::warn;
use rss::Channel;

use enums::common::sqlite::skip_reason::SkipReason;
use enums::common::sqlite::web_content_type::WebContentType;
use errors::AnyhowResult;

use crate::payloads::web_scraping_target::WebScrapingTarget;

// NB: Contains nearly 70 items
const RSS_TOP_STORIES : &str = "http://rss.cnn.com/rss/cnn_topstories.rss";

const RSS_WORLD : &str = "http://rss.cnn.com/rss/cnn_world.rss";

const RSS_US : &str = "http://rss.cnn.com/rss/cnn_us.rss";

const RSS_TECH : &str = "http://rss.cnn.com/rss/cnn_tech.rss";

const RSS_ENTERTAINMENT : &str = "http://rss.cnn.com/rss/cnn_showbiz.rss";

#[derive(Copy, Clone, Debug, EnumIter, EnumCount)]
pub enum CnnFeed {
  TopStories,
  World,
  UnitedStates,
  Tech,
  Entertainment,
}

impl CnnFeed {
  fn url(&self) -> &'static str {
    match self {
      Self::TopStories => RSS_TOP_STORIES,
      Self::World => RSS_WORLD,
      Self::UnitedStates => RSS_US,
      Self::Tech => RSS_TECH,
      Self::Entertainment => RSS_ENTERTAINMENT,
    }
  }
}

pub async fn cnn_indexer(feed: CnnFeed) -> AnyhowResult<Vec<WebScrapingTarget>> {
  let content = reqwest::get(feed.url())
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

    let mut maybe_skip_reason = None;

    // Lazy heuristic to skip CNN video articles, which contain little text.
    // eg. https://www.cnn.com/videos/politics/2023/02/08/pelosi-gop-hecklers-reaction-joe-biden-state-of-the-union-tapper-intv-vpx.cnn
    if canonical_url.contains("/videos/") {
      maybe_skip_reason = Some(SkipReason::VideoContent);
    }

    let maybe_image_url = item.extensions.get("media")
        .and_then(|media| media.get("group"))
        .and_then(|group| group.get(0))
        .and_then(|extension| extension.children.get("content"))
        .and_then(|extensions| extensions.get(0))
        .and_then(|extension| extension.attrs.get("url"))
        .map(|url| url.to_string());

    targets.push(WebScrapingTarget {
      canonical_url,
      web_content_type: WebContentType::CnnArticle,
      maybe_title: item.title.clone(),
      maybe_full_image_url: maybe_image_url,
      maybe_thumbnail_image_url: None,
      maybe_skip_reason,
    });
  }

  Ok(targets)
}
