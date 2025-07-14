use scraper::{Html, Selector};

pub fn extract_title(document: &Html, title_selector: &Selector) -> Option<String> {
  let title_element = match document.select(title_selector).next() {
    None => return None,
    Some(title_element) => title_element,
  };

  let mut pieces = Vec::new();

  for mut text in title_element.text() {
    text = text.trim();
    if !text.is_empty() {
      pieces.push(text.to_string());
    }
  }

  Some(pieces.join(" ").trim().to_string())
}

//#[cfg(test)]
//mod tests {
//  use scraper::Html;
//
//  use crate::common_extractors::extract_title::extract_title;
//  use crate::sites::cnn::cnn_article_scraper::CNN_TITLE_SELECTOR;
//  use crate::sites::techcrunch::techcrunch_article_scraper::TECHCRUNCH_TITLE_SELECTOR;
//
//  #[test]
//  fn test_extract_title_cnn() {
//    let html = include_str!("../../../../../test_data/html_scraping/cnn_article_with_video.html");
//    let document = Html::parse_document(&html);
//
//    let maybe_title = extract_title(&document, &CNN_TITLE_SELECTOR);
//
//    assert_eq!(Some("Ford Mustang Mach-E has a mile of wires it doesn’t need. That’s a big deal"),
//               maybe_title.as_deref());
//  }
//
//  #[test]
//  fn test_extract_title_techcrunch() {
//    let html = include_str!("../../../../../test_data/html_scraping/techcrunch_article.html");
//    let document = Html::parse_document(&html);
//
//    let maybe_title = extract_title(&document, &TECHCRUNCH_TITLE_SELECTOR);
//
//    assert_eq!(Some("‘Nothing, Forever,’ an AI ‘Seinfeld’ spoof, is the next ‘Twitch Plays Pokémon’"),
//               maybe_title.as_deref());
//  }
//}
