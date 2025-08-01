use scraper::{Html, Selector};

pub fn extract_featured_image(document: &Html, image_selector: &Selector) -> Option<String> {
  let image = match document.select(image_selector).next() {
    None => return None,
    Some(title_element) => title_element,
  };

  if let Some(img_source) = image.value().attr("src") {
    return Some(img_source.to_string());
  }

  // TODO: We might want more heuristics here, though there's a danger this method gets complicated.

  None
}

//#[cfg(test)]
//mod tests {
//  use scraper::{Html, Selector};
//
//  use crate::common_extractors::extract_featured_image::extract_featured_image;
//  use crate::sites::cnn::cnn_article_scraper::CNN_FEATURED_IMAGE_SELECTOR;
//  use crate::sites::techcrunch::techcrunch_article_scraper::TECHCRUNCH_FEATURED_IMAGE_SELECTOR;
//
//  #[test]
//  fn test_extract_cnn_with_video() {
//    let html = include_str!("../../../../../test_data/html_scraping/cnn_article_with_video.html");
//    let document = Html::parse_document(&html);
//
//    let maybe_image = extract_featured_image(&document, &CNN_FEATURED_IMAGE_SELECTOR);
//
//    assert_eq!(Some("https://media.cnn.com/api/v1/images/stellar/prod/220426143055-bill-ford-executive-chairman-ford-motor-company.jpg?c=16x9&q=w_850,c_fill"),
//               maybe_image.as_deref());
//  }
//
//  #[test]
//  fn test_extract_techcrunch() {
//    let html = include_str!("../../../../../test_data/html_scraping/techcrunch_article.html");
//    let document = Html::parse_document(&html);
//
//    let selector = Selector::parse(".article__title").expect("selector should parse");
//    let maybe_image = extract_featured_image(&document, &TECHCRUNCH_FEATURED_IMAGE_SELECTOR);
//
//    assert_eq!(Some("https://techcrunch.com/wp-content/uploads/2023/02/Screen-Shot-2023-02-02-at-1.46.55-PM.png?w=650"),
//               maybe_image.as_deref());
//  }
//}
