use std::ops::Deref;

use chrono::{DateTime, LocalResult, TimeZone, Utc};
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

use enums::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};

use crate::common_extractors::extract_attribute::extract_attribute;
use crate::common_extractors::extract_featured_image::extract_featured_image;
use crate::common_extractors::extract_title::extract_title;
use crate::payloads::web_scraping_result::{ScrapedWebArticle, WebScrapingResult};

/// The main article content container
static ARTICLE_CONTENT_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("section.content__body").expect("this selector should parse")
});

/// Paragraphs within the article
static PARAGRAPH_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("p").expect("this selector should parse")
});

/// The title of the article
pub static TITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("h1.content__title").expect("this selector should parse")
});

///// The title of the article
//pub static SUBTITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
//  Selector::parse("div[data-gu-name=\"standfirst\"] p").expect("this selector should parse")
//});

/// The article featured image
pub static FEATURED_IMAGE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("figure .embed__content img").expect("this selector should parse")
});

pub static DATETIME_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".content__meta--timestamp time").expect("this selector should parse")
});

pub async fn cbsnews_article_scraper(url: &str) -> AnyhowResult<WebScrapingResult> {
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

  let maybe_title = extract_title(&document, &TITLE_SELECTOR);
  let maybe_featured_image_url = extract_featured_image(&document, &FEATURED_IMAGE_SELECTOR);

  let maybe_timestamp_raw = extract_attribute(&document, &DATETIME_SELECTOR, "datetime");

  // Timestamp is present as *almost* RFC3339: 2023-02-23T19:30:30-0500
  // Frustratingly, there should be a colon in the timezone offset.
  let maybe_timestamp = maybe_timestamp_raw
      .as_deref()
      // This is a lazy af fix for the RFC3339 non-compliance.
      .map(|invalid| invalid.replace("-0400", "-04:00"))
      .map(|invalid| invalid.replace("-0500", "-05:00"))
      .map(|invalid| invalid.replace("-0600", "-06:00"))
      .map(|invalid| invalid.replace("-0700", "-07:00"))
      .map(|invalid| invalid.replace("-0800", "-08:00"))
      .map(|invalid| invalid.replace("-0900", "-09:00"))
      .map(|ts| DateTime::parse_from_rfc3339(ts.trim()))
      .transpose()?
      // We need to juggle from DateTime<NaiveOffset> to DateTime<Utc>.
      .map(|dt| dt.naive_utc())
      .map(|naive| match Utc.from_local_datetime(&naive) {
        LocalResult::None => Err(anyhow!("invalid datetime conversion")),
        LocalResult::Ambiguous(_, _) => Err(anyhow!("ambiguous datetime conversion")),
        LocalResult::Single(time) => Ok(time),
      })
      .transpose()?;

  let body_text = paragraphs.join("\n\n");

  Ok(WebScrapingResult {
    original_html: downloaded_document,
    result: ScrapedWebArticle {
      url: url.to_string(),
      web_content_type: WebContentType::CbsNewsArticle,
      maybe_title,
      maybe_subtitle: None,
      maybe_author: None, // TODO
      paragraphs,
      body_text,
      maybe_heading_image_url: None, // TODO
      maybe_featured_image_url,
      maybe_publish_timestamp_raw: maybe_timestamp_raw,
      maybe_publish_datetime_utc: maybe_timestamp,
    }
  })
}
