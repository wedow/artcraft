use std::io::Write;

use enums::by_table::web_scraping_targets::web_content_type::WebContentType;
use errors::AnyhowResult;
use web_scrapers::payloads::web_scraping_result::WebScrapingResult;

use crate::persistence::save_directory::SaveDirectory;

pub fn just_save(web_content_type: WebContentType, scraping_result: WebScrapingResult, save_directory: &SaveDirectory) -> AnyhowResult<()>
{
    let url = scraping_result.result.url;
    {
        let directory = save_directory.directory_for_webpage_url(&url)?;
        std::fs::create_dir_all(&directory)?;
    }

    {
        let html_filename = save_directory.html_file_for_webpage_url(&url)?;
        let mut file = std::fs::File::create(&html_filename)?;
        file.write_all(scraping_result.original_html.as_bytes())?;
    }

    {
        let yaml_filename = save_directory.scrape_summary_file_for_webpage_url(&url)?;
        let mut file = std::fs::File::create(&yaml_filename)?;
        serde_yaml::to_writer(file, &scraping_result.result)?;
    }

    Ok(())

}
