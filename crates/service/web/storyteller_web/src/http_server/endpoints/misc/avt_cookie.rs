use std::collections::BTreeMap;

use crate::server_state::ServerState;
use container_common::anyhow_result::AnyhowResult;
use tokens::avt::AnonymousVisitorToken;
use users_component::utils::crypted_cookie_manager::CryptedCookie;

pub const AVT_COOKIE_NAME: &'static str = "avt";

pub fn avt_cookie(server_state: &ServerState) -> AnyhowResult<CryptedCookie> {
    let mut map = BTreeMap::new();
    map.insert(AVT_COOKIE_NAME.to_string(), AnonymousVisitorToken::generate().to_string());
    Ok(server_state.ccm.encrypt_map_to_cookie(map, AVT_COOKIE_NAME.to_string())?)
}
