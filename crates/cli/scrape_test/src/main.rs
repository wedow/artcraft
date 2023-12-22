use clap::Parser;

use errors::AnyhowResult;
use web_scrapers::scrape_supported_webpage::scrape_supported_webpage;

#[derive(Parser, Debug)]
#[command(name = "scrape_test")]
pub struct Args {
  #[arg(name="url", short='u', long = "url", help = "URL of the page to scrape", required = true)]
  url: String,

  #[arg(name="print_html", long = "html", help = "Print the HTML scraped", required = true)]
  print_html: bool,
}

#[tokio::main]
pub async fn main() -> AnyhowResult<()> {
  let args = Args::parse();

  let url = args.url.trim().to_string();
  let print_html = args.print_html;

  let scrape_result = scrape_supported_webpage(&url).await?;

  if print_html {
    println!("{}", scrape_result.original_html)
  } else {
    println!("{:#?}", scrape_result.result)
  }

  Ok(())
}
