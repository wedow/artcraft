use easyenv::init_all_with_default_logging;
use log::info;

use container_common::anyhow_result::AnyhowResult;

fn main() -> AnyhowResult<()> {
    init_all_with_default_logging(None);

    info!("TODO...");

    Ok(())
}