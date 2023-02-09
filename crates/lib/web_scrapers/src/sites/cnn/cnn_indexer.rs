use crate::{payloads::web_scraping_target::WebScrapingTarget, common_extractors::extract_meta_rss::{RssMetaRequester, RssMetaIterator}};
use enums::by_table::web_scraping_targets::web_content_type::WebContentType;
use errors::AnyhowResult;
use log::warn;
use rss::Channel;

// NB: Contains nearly 70 items
const RSS_TOP_STORIES : &'static str = "http://rss.cnn.com/rss/cnn_topstories.rss";

const RSS_WORLD : &'static str = "http://rss.cnn.com/rss/cnn_world.rss";

const RSS_US : &'static str = "http://rss.cnn.com/rss/cnn_us.rss";

const RSS_TECH : &'static str = "http://rss.cnn.com/rss/cnn_tech.rss";

#[derive(Copy, Clone, Debug, EnumIter, EnumCount)]
pub enum CnnFeed {
  TopStories,
  World,
  UnitedStates,
  Tech,
}

impl CnnFeed {
  fn url(&self) -> &'static str {
    match self {
      Self::TopStories => RSS_TOP_STORIES,
      Self::World => RSS_WORLD,
      Self::UnitedStates => RSS_US,
      Self::Tech => RSS_TECH,
    }
  }
}

pub async fn cnn_indexer(feed: CnnFeed) -> AnyhowResult<Vec<WebScrapingTarget>> {
    let mut rss_meta_requester = RssMetaRequester::new(feed.url());
    let rss_meta_iter = rss_meta_requester.request().await?;

    //FIXME: get rid of this Vec if it's not too disruptive
    let targets = rss_meta_iter.map(|entry| {
        WebScrapingTarget {
            canonical_url: entry.url,
            web_content_type: WebContentType::CnnArticle,
            maybe_title: entry.maybe_title,
            maybe_full_image_url: entry.maybe_image_url,
            maybe_thumbnail_image_url: None,
        }
    }).collect();

  Ok(targets)
}
