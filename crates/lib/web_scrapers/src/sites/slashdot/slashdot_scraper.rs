use enums::by_table::web_scraping_targets::web_content_type::WebContentType;
use errors::AnyhowResult;

use crate::{common_extractors::extract_meta_rss::RssMetaScraper, payloads::web_scraping_result::{WebScrapingResult, ScrapedWebArticle}};

#[derive(Copy, Clone, Debug, EnumIter, EnumCount)]
pub enum SlashdotFeed {
    Main,
    Games,
    AskSlashdot,
    YourRightsOnline,
    Politics,
    Linux,
    Developers,
}

impl SlashdotFeed {
    fn url(&self) -> &'static str {
        match self {
            Self::Main =>  "http://rss.slashdot.org/Slashdot/slashdotMain",
            Self::Games => "http://rss.slashdot.org/Slashdot/slashdotGames",
            Self::AskSlashdot => "http://rss.slashdot.org/Slashdot/slashdotAskSlashdot",
            Self::YourRightsOnline => "http://rss.slashdot.org/Slashdot/slashdotYourRightsOnline",
            Self::Politics => "http://rss.slashdot.org/Slashdot/slashdotPolitics",
            Self::Linux => "http://rss.slashdot.org/Slashdot/slashdotLinux",
            Self::Developers => "http://rss.slashdot.org/Slashdot/slashdotDevelopers",
        }
    }
}

pub struct SlashdotScraper(RssMetaScraper);

impl SlashdotScraper {

    /// This won't have any data until refresh is called
    pub fn new(feed: SlashdotFeed) -> Self {
        Self (
            RssMetaScraper::new(feed.url()),
        )
    }

    pub async fn refresh(&mut self) -> AnyhowResult<()> {
        self.0.refresh().await
    }
}

impl std::iter::Iterator for SlashdotScraper {
    type Item = WebScrapingResult;

    fn next(&mut self) -> Option<Self::Item> {
        match self.0.next() {
            None => None,
            Some(entry) => {
                Some(WebScrapingResult {
                        original_html: String::new(), // we only scraped RSS, so we don't have this
                        result: ScrapedWebArticle {
                            url: entry.url,
                            web_content_type: WebContentType::SlashdotArticle,
                            maybe_title: entry.maybe_title,
                            maybe_author: entry.maybe_author,
                            paragraphs: Vec::new(), // sorry don't have this either
                            body_text: entry.maybe_summary.unwrap_or(String::new()),
                            maybe_heading_image_url: None,
                            maybe_featured_image_url: None,
                        }
                })
            }
        }
    }
}
