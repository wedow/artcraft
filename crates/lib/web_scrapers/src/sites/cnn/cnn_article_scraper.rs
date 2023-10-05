use std::ops::{Add, Deref};

use chrono::{DateTime, Duration, LocalResult, NaiveDateTime, TimeZone, Utc};
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

use enums::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};

use crate::common_extractors::extract_featured_image::extract_featured_image;
use crate::common_extractors::extract_text::extract_text;
use crate::common_extractors::extract_title::extract_title;
use crate::payloads::web_scraping_result::{ScrapedWebArticle, WebScrapingResult};
use crate::utils::remove_timestamp_abbreviated_timezone::remove_timestamp_abbreviated_timezone;
use crate::utils::remove_timestamp_abbreviated_weekday_name::remove_timestamp_abbreviated_weekday_name;

/// The main article content container
static ARTICLE_CONTENT_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".article__content").expect("this selector should parse")
});

/// Paragraphs within the article
static PARAGRAPH_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("p.paragraph").expect("this selector should parse")
});

/// The title of the article
pub static CNN_TITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".headline__text").expect("this selector should parse")
});

/// The article featured image
pub static CNN_FEATURED_IMAGE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".image__lede .image__picture > img").expect("this selector should parse")
});

pub static DATETIME_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse(".timestamp").expect("this selector should parse")
});

pub async fn cnn_article_scraper(url: &str) -> AnyhowResult<WebScrapingResult> {
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

  let maybe_title = extract_title(&document, &CNN_TITLE_SELECTOR);
  let maybe_heading_image_url = extract_featured_image(&document, &CNN_FEATURED_IMAGE_SELECTOR);

  // Timestamp is present as "Published\n11:25 PM EST, Thu February 23, 2023"
  let maybe_timestamp_raw = extract_text(&document, &DATETIME_SELECTOR)
      .map(|raw| raw.replace("Published", ""))
      .map(|raw| raw.replace("Updated", ""))
      .map(|raw| raw.trim().to_string());

  let maybe_timestamp = maybe_timestamp_raw
      .as_deref()
      .and_then(parse_timestamp);

  let body_text = paragraphs.join("\n\n");

  Ok(WebScrapingResult {
    original_html: downloaded_document,
    result: ScrapedWebArticle {
      url: url.to_string(),
      web_content_type: WebContentType::CnnArticle,
      maybe_title,
      maybe_subtitle: None,
      maybe_author: None, // TODO
      paragraphs,
      body_text,
      maybe_heading_image_url,
      maybe_featured_image_url: None, // TODO
      maybe_publish_timestamp_raw: maybe_timestamp_raw,
      maybe_publish_datetime_utc: maybe_timestamp,
    }
  })
}

fn parse_timestamp(timestamp: &str) -> Option<DateTime<Utc>> {
  // NB: CNN article timestamps are horrible.
  let timestamp = timestamp
      .replace("Published\n", "")
      .replace("Updated\n", "")
      .trim()
      .to_string();

  // NB: Remove attributes that parse_from_str() struggles with.
  // TODO: This is such a flaky, unstable hack
  let maybe_timestamp = Some(timestamp)
      .map(|ts| remove_timestamp_abbreviated_weekday_name(&ts))
      .map(|ts| remove_timestamp_abbreviated_timezone(&ts))
      .map(|ts| ts.replace("  ", " "))
      .map(|ts| ts.replace(" , ", ", "));

  // Parse
  

  maybe_timestamp
      .map(|ts| NaiveDateTime::parse_from_str(&ts, "%l:%M %P, %B %e, %Y"))
      .transpose()
      .ok()
      .flatten()
      .map(|naive| match Utc.from_local_datetime(&naive) {
        LocalResult::None => Err(anyhow!("invalid datetime conversion")),
        LocalResult::Ambiguous(_, _) => Err(anyhow!("ambiguous datetime conversion")),
        LocalResult::Single(time) => Ok(time),
      })
      .transpose()
      .ok()
      .flatten()
      // NB: The "Utc" time above is actually EST/EDT.
      .map(|utc| utc.add(Duration::hours(5)))
}

#[cfg(test)]
mod tests {
  use crate::sites::cnn::cnn_article_scraper::parse_timestamp;

  #[test]
  fn test_published() {
    // NB: Actual website timestamp
    assert!(parse_timestamp("Updated\n        5:55 PM EST, Thu February 23, 2023").is_some());
  }

  fn test_updated() {
    // NB: Actual website timestamp
    assert!(parse_timestamp("Published\n        11:25 PM EST, Thu February 23, 2023").is_some());
  }
}