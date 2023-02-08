use chrono::{DateTime, Utc};
use errors::AnyhowResult;
use html2text::from_read;
use log::warn;
use rss::{Enclosure, Channel};

pub struct RssMetaScraper {
    feed_url: &'static str,
    feed_data: Option<Channel>,
}


impl RssMetaScraper {
    /// This doesn't fetch any data until refresh is called!
    pub fn new(feed_url: &'static str) -> Self {
        Self {
            feed_url,
            feed_data: None,
        }
    }

    pub async fn refresh(&mut self) -> AnyhowResult<()> {
        let body = reqwest::get(self.feed_url)
       .await?
       .bytes()
       .await?;

        self.feed_data = match Channel::read_from(&body[..]) {
            Ok(data) => Some(data),
            Err(_e) => None,
        };
        Ok(())
    }
}



impl std::iter::Iterator for RssMetaScraper {
    type Item = RssMeta;

    fn next(&mut self) -> Option<Self::Item> {

        let entry = match &self.feed_data {
            Some(feed) => {
               feed.items.iter().next() 
            }
            None => None,
        };
        
        match entry {
            None => None,
            Some(entry) => {
                let maybe_title = &entry.title;
                let url = match entry.link() {
                    Some(url) => url.to_string(),
                    None => {
                        warn!("Skipping item due to not having a URL");
                        String::new()
                    }
                };

                let maybe_summary = match &entry.description {
                Some(maybe_html) => {
                    let plaintext = from_read(maybe_html.as_bytes(), maybe_html.len());
                    Some(plaintext)
                    },
                    None => None
                };

                let maybe_author = &entry.author;
                let categories = entry.categories.iter().map(|cat| cat.name().to_string()).collect();

                let maybe_publish_date = match &entry.pub_date {
                    Some(rfc2822) => {
                        let date: DateTime<Utc> = DateTime::parse_from_rfc2822(&rfc2822).ok()?.into();
                        Some(date)
                    }
                    None => None,
                };

                let maybe_content = match &entry.content {
                Some(maybe_html) => {
                    let plaintext = from_read(maybe_html.as_bytes(), maybe_html.len());
                    Some(plaintext)
                    }
                    None => None
                };

                let maybe_media = &entry.enclosure;

                let maybe_image_url = entry.extensions.get("media")
                .map(|media| media.get("group"))
                .flatten()
                .map(|group| group.get(0))
                .flatten()
                .map(|extension| extension.children.get("content"))
                .flatten()
                .map(|extensions| extensions.get(0)) // NB: First image is biggest
                .flatten()
                .map(|extension| extension.attrs.get("url"))
                .flatten()
                .map(|url| url.to_string());


                Some(RssMeta {
                    maybe_title: maybe_title.clone(),
                    url,
                    maybe_summary,
                    maybe_author: maybe_author.clone(),
                    categories,
                    maybe_publish_date,
                    maybe_content,
                    maybe_media: maybe_media.clone(),
                    maybe_image_url,
                })
            }
        }
    }
}

pub struct RssMeta {
    pub maybe_title: Option<String>,
    pub url: String,
    pub maybe_summary: Option<String>,
    pub maybe_author: Option<String>,
    pub categories: Vec<String>,
    pub maybe_publish_date: Option<DateTime<Utc>>,
    pub maybe_content: Option<String>,

    // TODO: we might want to do more processing on this at this level
    // in order to better inform downstream, skipping it for now.
    pub maybe_media: Option<Enclosure>, 

    // copied from code intended for CNN, may not apply well more generally
    pub maybe_image_url: Option<String>,
}
