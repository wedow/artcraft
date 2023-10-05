use std::ops::{Add, Deref};

use chrono::{Duration, LocalResult, NaiveDateTime, TimeZone, Utc};
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

use enums::common::sqlite::web_content_type::WebContentType;
use errors::{anyhow, AnyhowResult};

use crate::common_extractors::extract_featured_image::extract_featured_image;
use crate::common_extractors::extract_text::extract_text;
use crate::common_extractors::extract_title::extract_title;
use crate::payloads::web_scraping_result::{ScrapedWebArticle, WebScrapingResult};
use crate::utils::remove_timestamp_abbreviated_weekday_name::remove_timestamp_abbreviated_weekday_name;

/// The main article content container
static ARTICLE_CONTENT_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("#maincontent").expect("this selector should parse")
});

/// Paragraphs within the article
static PARAGRAPH_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("p").expect("this selector should parse")
});

/// The title of the article
pub static TITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("h1").expect("this selector should parse")
});

/// The title of the article
pub static SUBTITLE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("div[data-gu-name=\"standfirst\"] p").expect("this selector should parse")
});

/// The article featured image
pub static FEATURED_IMAGE_SELECTOR: Lazy<Selector> = Lazy::new(|| {
  Selector::parse("figure picture img").expect("this selector should parse")
});

pub static DATETIME_SELECTOR : Lazy<Selector> = Lazy::new(|| {
  Selector::parse("aside[data-gu-name=\"meta\"] summary span").expect("this selector should parse")
});

pub async fn theguardian_article_scraper(url: &str) -> AnyhowResult<WebScrapingResult> {
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
  let maybe_subtitle = extract_title(&document, &SUBTITLE_SELECTOR);
  let maybe_heading_image_url = extract_featured_image(&document, &FEATURED_IMAGE_SELECTOR);

  let maybe_timestamp_raw = extract_text(&document, &DATETIME_SELECTOR);

  // Format on webpage: "Thu 23 Feb 2023 12.39 EST",
  // Parsed with: "Thu (%a) 23 (%e) Feb (%b) 2023 (%Y) 12 (%H).39 (%M) EST (%Z)",
  // However, the "%a" (abbreviated weekday) fails to parse, so we remove it.
  // Furthermore, it's unable to use the timezone data and the library hates it, so we
  // have to type juggle.
  let maybe_timestamp = maybe_timestamp_raw
      .as_deref()
      .map(remove_timestamp_abbreviated_weekday_name)
      .map(|ts| NaiveDateTime::parse_from_str(&ts, "%e %b %Y %H.%M %Z"))
      .transpose()?
      .map(|naive| match Utc.from_local_datetime(&naive) {
        LocalResult::None => Err(anyhow!("invalid datetime conversion")),
        LocalResult::Ambiguous(_, _) => Err(anyhow!("ambiguous datetime conversion")),
        LocalResult::Single(time) => Ok(time),
      })
      .transpose()?
      // NB: The "Utc" time above is actually EST/EDT.
      .map(|utc| utc.add(Duration::hours(5)));

  let body_text = paragraphs.join("\n\n");

  Ok(WebScrapingResult {
    original_html: downloaded_document,
    result: ScrapedWebArticle {
      url: url.to_string(),
      web_content_type: WebContentType::TheGuardianArticle,
      maybe_title,
      maybe_subtitle,
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
