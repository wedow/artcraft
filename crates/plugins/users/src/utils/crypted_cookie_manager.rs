use std::collections::BTreeMap;
use actix_web::cookie::Cookie;
use container_common::anyhow_result::AnyhowResult;
use hmac::{NewMac, Hmac};
use jwt::{SignWithKey, VerifyWithKey, ToBase64, FromBase64};
use sha2::Sha256;
use anyhow::anyhow;

#[derive(Clone)]
pub struct CryptedCookieManager<'manager> {
    cookie_domain: &'manager str,
    hmac_secret: &'manager str,
}


#[derive(Clone)]
pub struct CryptedCookie<'manager>(pub Cookie<'manager>);

impl<'manager> CryptedCookieManager<'manager> {
    pub fn new(cookie_domain: &'manager str, hmac_secret: &'manager str) -> Self {
        Self {
            cookie_domain,
            hmac_secret
        }
    }

    fn encrypt_map(&self, map: BTreeMap<String, String>) -> AnyhowResult<String> {
         let key: Hmac<Sha256> = Hmac::new_varkey(self.hmac_secret.as_bytes())
            .map_err(|e| anyhow!("invalid hmac: {:?}", e))?;
         map.sign_with_key(&key).map_err(|e| anyhow!("failed to encrypt: {:?}", e))
    }

    fn decrypt_map(&self, str: &str) -> AnyhowResult<BTreeMap<String, String>> {
         let key: Hmac<Sha256> = Hmac::new_varkey(self.hmac_secret.as_bytes())
            .map_err(|e| anyhow!("invalid hmac: {:?}", e))?;
        let map: BTreeMap<String, String> = str.verify_with_key(&key)?;
        Ok(map)
    }

    /// Note: the cookies created by this function are permanent by default,
    /// expiration can be modified afterwards if desired
    pub fn encrypt_map_to_cookie(&self, map: BTreeMap<String, String>, cookie_name: &'manager str) -> AnyhowResult<CryptedCookie> {
        let jwt = self.encrypt_map(map)?;
        let make_secure = !self.cookie_domain.to_lowercase().contains("jungle.horse")
            && !self.cookie_domain.to_lowercase().contains("localhost");

        Ok(CryptedCookie(Cookie::build(
            cookie_name,
            jwt
        )
        .secure(make_secure)
        .permanent()
        .finish()))
    }

    pub fn decrypt_cookie_to_map(&self, cookie: &CryptedCookie) -> AnyhowResult<BTreeMap<String, String>> {
        self.decrypt_map(cookie.0.value())
    }

}

#[test]
fn test_existing_session_cookie() {
    use std::collections::BTreeMap;

    let cookie = "";
    let key = "";

    let ccm = CryptedCookieManager::new("fakeyou.com", &key);

    let decrypted = ccm.decrypt_map(existing_cookie).unwrap();
    println!("{:#?}", decrypted);
}
