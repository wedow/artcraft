use std::collections::BTreeMap;
use actix_web::cookie::Cookie;
use container_common::anyhow_result::AnyhowResult;
use hmac::{NewMac, Hmac};
use jwt::{SignWithKey, VerifyWithKey, ToBase64, FromBase64};
use sha2::Sha256;
use anyhow::anyhow;

#[derive(Clone)]
pub struct CryptedCookieManager {
    cookie_domain: String,
    hmac_secret: String,
}


#[derive(Clone)]
pub struct CryptedCookie<'a>(pub Cookie<'a>);

impl CryptedCookieManager{
    pub fn new(cookie_domain: String, hmac_secret: String) -> Self {
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
    pub fn encrypt_map_to_cookie(&self, map: BTreeMap<String, String>, cookie_name: String) -> AnyhowResult<CryptedCookie> {
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
fn test_develop_session_cookie() {
    let cookie = "eyJhbGciOiJIUzI1NiJ9.eyJjb29raWVfdmVyc2lvbiI6IjIiLCJzZXNzaW9uX3Rva2VuIjoiU0VTU0lPTjpwanlrZXh2aHY3NHNxamIxZjJiNzBmMXoiLCJ1c2VyX3Rva2VuIjoiVTozQ01GNzZRSjM3RjI1In0.8xXVSKUna0x_KaJ4NJUamQvyX3GYcBjwNf7UD7Ix-hk";
    let key = "notsecret";
    let ccm = CryptedCookieManager::new("api.jungle.horse", &key);
    let decrypted = ccm.decrypt_map(cookie).unwrap();
    let mut expected_map: BTreeMap<String, String> = BTreeMap::new();

    expected_map.insert("cookie_version".to_string(), "2".to_string());
    expected_map.insert("session_token".to_string(), "SESSION:pjykexvhv74sqjb1f2b70f1z".to_string());
    expected_map.insert("user_token".to_string(), "U:3CMF76QJ37F25".to_string());

    assert_eq!(decrypted, expected_map);
}
