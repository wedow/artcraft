use std::ops::Sub;
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use byteorder::{LittleEndian, WriteBytesExt};
use chrono::{TimeDelta, Utc};
use log::error;
use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::index_parsers::parse_index_verification_token::VerificationToken;

/*
xsid: str = Signature.generate_sign('/rest/app-chat/conversations/new', 'POST', self.verification_token, self.svg_data, self.numbers)

    @staticmethod
    def generate_sign(path: str, method: str, verification: str, svg: str, x_values: list, time_n: int = None, random_float: float = None) -> str:

        n = int(time() - 1682924400) if not time_n else time_n
        t = pack('<I', n)
        r = b64decode(verification)
        o = Signature.xs(r, svg, x_values)

        msg = "!".join([method, path, str(n)]) + "obfiowerehiring" + o
        digest = sha256(msg.encode('utf-8')).digest()[:16]

        prefix_byte = int(floor(random() if not random_float else random_float * 256))
        assembled = bytes([prefix_byte]) + r + t + digest + bytes([3])

        arr = bytearray(assembled)
        if len(arr) > 0:
            first = arr[0]
            for i in range(1, len(arr)):
                arr[i] = arr[i] ^ first

        return b64encode(bytes(arr)).decode('ascii').replace('=', '')
 */

pub struct GenerateSignArgs<'a> {
  /// Path of the request,
  /// eg. `/rest/app-chat/conversations/new`
  pub path: &'a str,

  /// HTTP Method
  /// eg. `POST`
  pub method: &'a str,

  pub verification_token: &'a VerificationToken,

  pub svg_data: &'a str,

  pub numbers: &'a [u8],
}

pub fn generate_sign(args: GenerateSignArgs<'_>) -> Result<(), GrokClientError> {
  let t = 1761646073; // TODO: REPLACE

  //let n = Utc::now().timestamp() - 1682924400;
  let n = t - 1682924400;


  println!("n = {}", n);

  // MATCH !
  // \x892\xb1\x04 vs
  // [137, 50, 177, 4]
  let mut t = vec![];
  t.write_u32::<LittleEndian>(n).unwrap(); // TODO Unwrap

  println!("t = {:?}", t);

  // MATCH !
  let r = BASE64_STANDARD.decode(&args.verification_token.0)
      .map_err(|err| {
        error!("Decode verification_token failed. {}", err);
        GrokClientError::FailedToDecodeVerificationToken(err)
      })?; // TODO: Not sure this is right.

  println!("r = {:?}", r);

  Ok(())
}


#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use crate::requests::index_page::index_parsers::parse_index_verification_token::VerificationToken;
  use crate::requests::index_page::signature::generate_sign_for_new_conversation::{generate_sign, GenerateSignArgs};

  #[test]
  fn test() -> AnyhowResult<()> {
    let ver = VerificationToken("yt16CWiUI42s7wGGeMxcdEIT2miPF5PVOGZF1Jcae7K7HMQrLeI4RTYufmdfBIZU".to_string());
    let svg_data = "M 10,30 C 147,16 51,222 136,87 h 31 s 177,77 40,114 C 68,166 18,188 114,44 h 220 s 148,210 202,25 C 220,36 246,218 12,120 h 244 s 34,154 56,161 C 211,204 208,60 174,14 h 155 s 157,116 220,95 C 116,164 53,210 174,232 h 139 s 148,151 135,221 C 167,196 118,27 149,247 h 233 s 129,238 113,21 C 73,44 215,158 218,29 h 68 s 13,98 243,134 C 44,98 149,35 20,178 h 163 s 219,104 41,152 C 237,107 118,120 127,117 h 57 s 41,167 43,136 C 116,168 44,246 182,209 h 143 s 238,93 237,119 C 142,36 64,67 97,111 h 71 s 230,247 119,27 C 206,56 158,51 71,115 h 135 s 120,186 74,57 C 197,165 180,214 102,16 h 88 s 252,48 189,166 C 163,237 57,253 154,60 h 96 s 84,56 15,66 C 177,101 10,202 185,227 h 29 s 204,55 115,219 C 103,82 127,143 194,99 h 102 s 179,63 84,110";
    let result = generate_sign(GenerateSignArgs {
      path: "/rest/app-chat/conversations/new",
      method: "POST",
      verification_token: &ver,
      svg_data: &svg_data,
      numbers: &[40, 18, 3, 18],
    })?;

    assert_eq!(1,2);
    Ok(())
  }
}
