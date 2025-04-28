use std::collections::HashSet;
use std::iter::Map;
use cookie::Cookie;
use once_cell::sync::Lazy;
use errors::AnyhowResult;

pub const SESSION_COOKIE_NAME : &str = "__Secure-authjs.session-token";

/// Cookies Sora.com mints that are not the session cookie. We can ignore these.
/// This list is very likely to change over time.
const IRRELEVANT_COOKIE_NAMES: Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "cf_clearance",
    "oai-did",
    "_cfuvid",
    "__cflb",
    "__cf_bm",
    "__Host-authjs.csrf-token",
    "__Secure-authjs.callback-url",
    "__Secure-authjs.pkce.code_verifier",
    "__Secure-authjs.state",
  ])
});

/// Super naive heuristic for "logged out" total cookie length being ~1972 characters.
const SESSION_COOKIE_LENGTH_HEURISTIC : usize = 2000;

//pub fn has_session_cookie(cookies: &str) -> bool {
//  // NB: This is not a valid check for cookies, just a cheap heuristic.
//  cookies.contains(SESSION_COOKIE_NAME)
//}

#[derive(Copy,Clone,Eq,PartialEq,Debug)]
pub enum SessionCookiePresence {
  Present,
  MaybePresent,
  Absent,
}

/// OpenAI might change the name of the session cookie, and we don't want to break clients,
/// so we use some heuristics to determine if the cookie might be present.
pub fn has_session_cookie(cookies_header: &str) -> AnyhowResult<SessionCookiePresence> {
  let cookies_header = cookies_header.trim();
  if (cookies_header.is_empty()) {
    return Ok(SessionCookiePresence::Absent);
  }

  let cookies = Cookie::split_parse(cookies_header);
  let mut unknown_cookie_count = 0; // NB: In the event they change their session cookie

  for cookie in cookies {
    let cookie= cookie?;
    let cookie_name = cookie.name();
    if cookie_name == SESSION_COOKIE_NAME {
      return Ok(SessionCookiePresence::Present);
    } else if !IRRELEVANT_COOKIE_NAMES.contains(cookie_name) {
      unknown_cookie_count += 1;
    }
  }

  // This is a really stupid heuristic, but we want to be safe.
  if cookies_header.len() > SESSION_COOKIE_LENGTH_HEURISTIC {
    return Ok(SessionCookiePresence::MaybePresent);
  }

  // Another stupid heuristic.
  if unknown_cookie_count > 3 {
    return Ok(SessionCookiePresence::MaybePresent);
  }

  Ok(SessionCookiePresence::Absent)
}

#[cfg(test)]
mod tests {
  use crate::utils::has_session_cookie::{has_session_cookie, SessionCookiePresence};

  #[test]
  fn test() {
    assert_eq!(has_session_cookie("").unwrap(), SessionCookiePresence::Absent);
    assert_eq!(has_session_cookie("foo=bar").unwrap(), SessionCookiePresence::Absent);

    // Heuristic: unknown cookies.
    assert_eq!(has_session_cookie("foo=bar;bin=baz;bat=ban;bash=barn").unwrap(), SessionCookiePresence::MaybePresent);

    // Heuristic: cookie length
    let cookies = format!("cookie={}", "a".repeat(10000));
    assert_eq!(has_session_cookie(&cookies).unwrap(), SessionCookiePresence::MaybePresent);

    let cookies = "__Host-authjs.csrf-token=a2783b5f89ee8dcb184f64723c3fdc91868f89840cb842fb20c3bd3\
    d6b087d97%7C8e85a84ac3870dfab160d96c45fb8a0430350ae4b4755784c03c3b97a927eb06; __Secure-authjs.c\
    allback-url=https%3A%2F%2Fsora.com%2F; __cflb=0H28vtyuPgbsDEUozcoHSWoAnvpSqAh9PUFn8MimKwT; __Se\
    cure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiYWNBYVdTWHBfa\
    DZnNkxtUEs1S0RvTjR3NHFxTEsxVlpSTHA4VWdiaFdWNjctMG5pbDdVVjBCN2dSUU9Bem84ZXBjMVFjb1ozNGxwa0c1OEUy\
    U2Q4cUEifQ..I4nYqp8dqgnuBwIgzbtoTg.etnsxNRheMCGgAFaTzAxGdqjao68Xf_NCHqv8h5ZBhfDx_b0dg2bzDIfNFF5\
    _8VG1dwZkqe83k3JrOejBVKi3wDSI5p_EgU8YKf_oxshusBn09mGZmAPd49_F73DARypF0eHKyUnGfelkFmVW610P0nV3Pn\
    KNJhjIHHxAh_9dHnRvQ5WtaYMvSTE5Yc8Ut1VwKs9QmYdTkfcC_gDATQ-dgF8eew5Seh4KALizGcQqYhcENMVzfshSMwNrr\
    mZ-RL6X71wTqhKV3XiJnp_s7e6DxRfcb25V-aOD_rsVa1uAxpYzYvc197Cd0psqQ1MpPjGohUSXjwg177FvBmloAxy8-Qbf\
    Moz9ofugywgEqQBJIEznddwEOScVqoOhRbYXGpqBY-rU5ChDG4qetbfKNCX2DT0R0lShR1n-UXo-XJJuuFJ-FRPTOGMVJHX\
    5CT-k258ybtsMBM7sMQhohpjMnJuSZkloj0L6gZltG21syJy-14X4ykU20lfneVn-yKorTo2JbDMWUvWhdEIVt5-5czXmA7\
    csWiqmCgrkSHsw0NescOtLT1VfqW2aAd6X8ShsDzyMjfBC5GW84S1uBUURbr0WkcxLZFb_IsKaAA0xsfUri0rHXi35rabhM\
    KgH4mn8RztNsyod-tEwLil1LZS2HmoyB8RAC1xh5HIhDe3RJYaHyCdXJqeZjb1KBC1xDQV2QbQZ91y0JZzBXvg6NTFYJ-wb\
    CytyOnEbknHG_AM0p-GvxjckkL1PbasHdiOOKyT49hYCEQF0Zrnmq4DlvO46CpLBvpENC3NlqDJ3d3RD9_-WVn1yjVHI4Yl\
    VPFAyrYnfhtRF7WlgBPOnq6mPDF17dSIdLLWH3iQQQFfq-zxULLn0RaHWgeWndOaOLVPLe6fxZ_6-_lFLR-Vi-DiJj8dAM4\
    lRTUucyoXv93vqzCxN653V-LOTmg7SFpe2OXFsmXHiufoFQcVm-erpNZ3_hlxOOdYJh8wuQUBUKPhwqunTcIHZIr2QqjmnX\
    SSmBPw1-HQtWkEVGA5qKWLwciaX74Z8NtUWnbC4ZmYGTbnirIbsZ0EyYRNDvNjNGMoWrJBCyi_K3uP6g1GT-Zhc123dGZqu\
    1REqPiCmGK8l3ofOHEVFFG7k-Yc80RiVI7EQ2i5qN7nJEavDetXuC-nlbTbYqjqEut31T9G-IC3HRkHg7HLEBIOVYKbPLe5\
    BNzfAYO48YlBc1CLRFcx5LQMM1X_hS_WKLtYPkGxE7BZnR11Acf904kELPbL1-7-ZXnAYiQodwa9wzS6uLqdy6FCuqOG08E\
    K2mCDsIZXw3mjqOlDLXSSLNmu6CH5r3aXcnVaYHJQpSryPfNpNltXdYnrxF2CgWHPAOuleCKHY6nH9aKIH6RsFN7ZhgLZl4\
    5NnVzU3dx5PiSuwELiXFbziCXqfcbbUrhfwnJKPMxQqxErqadM6u9b4hB4QTZq41_OEu3S3Y8y2E1aGPZ81IMK4QRb5A4wh\
    WR9gBGF1FUud9JB5kfI479rpcwlDtoCxTkaixTsU0DwNzqA0gZvXZbJAqtSjyJIhTU_OBz94YzMsYYbuLSi82dm_a90zV6n\
    EnCYjuPuS6F2nUgW7BhNRGzusP7oIiECCJM8US2iWAGcQffhsEiwmB7YxET3gTifxNv6TI96muD0qA0G7zoNJkTQ11jxnWk\
    PqDHH1Mk545Ge7hL3YvjjFcJwhypNHxJCicQeuqOuzJtiS8DAzC1T7xS6ZbpFi8vcXmmv439RKYw4FoDfkl3JA8dBLM-Dii\
    2UlSX0byjppcjDOVX1G4azYoJawXhAchOFTkh7ZgAmAC-XIQYN3KZIwUpWIbnkTt-8V-SQlf56YW6VNNP7dAYM8rhqC7quC\
    QfFicZYH32oTenr6-75Bq6dFGCdF4Ieh4M1eVI8tgaOM9X-kVy5gliQ61gyyPFiVLGkPJQfJT6jWPVAu1JrB6v0mNm7G10m\
    qUPptxw38K_75Mvqd4D5ye6JUAii9iCMbZ8YMZHD4ncum-WJ2cDofssiXM_psgB6W94-PxxFZxfzL8MIqKe1ozAA8pJIyVu\
    gqm-AYcFJprbW3C6cgTfeZNW1_4k0stDgE3N2jCVLvGMKkiGTYC_SwgzqF3DU8Up0p_jMoJQ9hh3re7fjEGuKvtIfc_jeFq\
    c9-q1LsVirGizzhS_VTA5Ltnh4quwaIU3zkI_y3N9xV62ijUectvOPWONl42Qm9NUU4fQZynrUbTd9sSjYRNHfveIMDhbCj\
    dDWjzHjMgCeUopSyrLLra1uC0NsJrBoq24QMQ00jHgKWOnqpdFTjPopZ-zDcN0E4FkYB8kKbrz4u4ZIn0fNNnE2bzlU8rbH";

    assert_eq!(has_session_cookie(cookies).unwrap(), SessionCookiePresence::Present);
  }
}
