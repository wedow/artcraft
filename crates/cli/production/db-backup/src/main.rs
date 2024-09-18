use log::info;

use easyenv::init_all_with_default_logging;
use sqlx::{MySqlConnection, Executor, Connection};
use errors::AnyhowResult;

#[tokio::main]
async fn main() -> AnyhowResult<()> {
    init_all_with_default_logging(None);

    info!("TODO...");

    let url = "mysql://storyteller:password@localhost/storyteller";
    let mut conn = MySqlConnection::connect(url).await.unwrap();

    // This is the method the macros use. It's hidden in the docs because it's not considered part of the stable API.
    let describe = conn.describe("SELECT internal_token FROM api_tokens").await.unwrap();

    println!("describe output: {:?}", describe);
    assert_eq!(1,2);

    Ok(())
}
