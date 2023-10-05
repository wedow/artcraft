use std::ops::Deref;

use once_cell::sync::Lazy;
use scraper::{Html, Selector};

use enums::common::sqlite::web_content_type::WebContentType;
use errors::AnyhowResult;

use crate::common_extractors::extract_featured_image::extract_featured_image;
use crate::common_extractors::extract_title::extract_title;
use crate::payloads::web_scraping_result::{ScrapedWebArticle, WebScrapingResult};

/// The main article content container
static ARTICLE_CONTENT_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".article-content").expect("this selector should parse")
});

/// Paragraphs within the article
static PARAGRAPH_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  // NB: Techcrunch content issue:
  // The "div >" removes mysterious inclusion of Twitter <iframe>s
  // (not sure why those are included, as the dom doesn't include <p>'s)
  Selector::parse("div > p").expect("this selector should parse")
});

/// The title of the article
pub static TECHCRUNCH_TITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".article__title").expect("this selector should parse")
});

/// The article featured image
pub static TECHCRUNCH_FEATURED_IMAGE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".article__featured-image").expect("this selector should parse")
});

// NB: Date is only present on articles with Javascript, otherwise the DOM encodes relative "days ago"
//pub static DATETIME_SELECTOR : Lazy<Selector> = Lazy::new(|| {
//  Selector::parse(".full-date-time").expect("this selector should parse")
//});

pub async fn techcrunch_article_scraper(url: &str) -> AnyhowResult<WebScrapingResult> {
  let downloaded_document= reqwest::get(url)
      .await?
      .bytes()
      .await?;

  let downloaded_document = String::from_utf8_lossy(downloaded_document.deref()).to_string();
  let document = Html::parse_document(&downloaded_document);

  let mut paragraphs = Vec::new();

  if let Some(article_content_div) = document.select(&ARTICLE_CONTENT_SELECTOR).next() {
    for paragraph in article_content_div.select(&PARAGRAPH_SELECTOR) {

      let mut paragraph_assembly = Vec::new();

      for text in paragraph.text() {
        let stripped = text.trim();
        if !stripped.is_empty() {
          paragraph_assembly.push(stripped.to_string());
        }
      }

      let paragraph_full_text = paragraph_assembly.join(" ")
          .trim()
          .to_string();

      if !paragraph_full_text.is_empty() {
        paragraphs.push(paragraph_full_text);
      }
    }
  }

  let maybe_title = extract_title(&document, &TECHCRUNCH_TITLE_SELECTOR);
  let maybe_heading_image_url = extract_featured_image(&document, &TECHCRUNCH_FEATURED_IMAGE_SELECTOR);

  //let maybe_timestamp_raw = extract_attribute(&document, &DATETIME_SELECTOR, "datetime");
  //
  //// Timestamp is present as RFC3339: 2023-02-23T19:30:30-05:00
  //let maybe_timestamp = maybe_timestamp_raw
  //    .as_deref()
  //    .map(|ts| DateTime::parse_from_rfc3339(ts.trim()))
  //    .transpose()?
  //    // We need to juggle from DateTime<NaiveOffset> to DateTime<Utc>.
  //    .map(|dt| dt.naive_utc())
  //    .map(|naive| match Utc.from_local_datetime(&naive) {
  //      LocalResult::None => Err(anyhow!("invalid datetime conversion")),
  //      LocalResult::Ambiguous(_, _) => Err(anyhow!("ambiguous datetime conversion")),
  //      LocalResult::Single(time) => Ok(time),
  //    })
  //    .transpose()?;

  let body_text = paragraphs.join("\n\n");

  Ok(WebScrapingResult {
    original_html: downloaded_document,
    result: ScrapedWebArticle {
      url: url.to_string(),
      web_content_type: WebContentType::TechCrunchArticle,
      maybe_title,
      maybe_subtitle: None,
      maybe_author: None, // TODO
      paragraphs,
      body_text,
      maybe_heading_image_url,
      maybe_featured_image_url: None, // TODO
      maybe_publish_timestamp_raw: None,
      maybe_publish_datetime_utc: None,
    }
  })
}
