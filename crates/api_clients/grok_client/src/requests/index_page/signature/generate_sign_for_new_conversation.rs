use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::index_parsers::parse_index_verification_token::VerificationToken;
use crate::requests::index_page::signature::signature_xs::signature_xs;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use byteorder::{LittleEndian, WriteBytesExt};
use chrono::{TimeDelta, Utc};
use log::error;
use sha2::{Digest, Sha256};
use std::ops::Sub;
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

  // "x_values"
  pub numbers: &'a [u8],
}

pub fn generate_sign(args: GenerateSignArgs<'_>) -> Result<String, GrokClientError> {
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

  // o = Signature.xs(r, svg, x_values)
  let o = signature_xs(&r, &args.svg_data, &args.numbers)?;

  // generate_sign.o 4320e30fd70a3d70a3d7028f5c28f5c28f6028f5c28f5c28f60fd70a3d70a3d700
  println!("o = {:?}", o);

  //msg = "!".join([method, path, str(n)]) + "obfiowerehiring" + o
  let method = args.method;
  let path = args.path;
  let msg = format!("{method}!{path}!{n}obfiowerehiring{o}");

  // POST!/rest/app-chat/conversations/new!78721673obfiowerehiring4320e30fd70a3d70a3d7028f5c28f5c28f6028f5c28f5c28f60fd70a3d70a3d700
  println!("msg = {}", msg);

  //digest = sha256(msg.encode('utf-8')).digest()[:16]

  let digest_all_bytes = Sha256::digest(msg.as_bytes()).to_vec();
  println!("digest_all_bytes = {:?}", digest_all_bytes);

  if digest_all_bytes.len() < 16 {
    error!("Digest is too short: {}", digest_all_bytes.len());
    return Err(GrokClientError::BadSignatureInputs);
  }

  let digest : &[u8] = &digest_all_bytes[.. 16];

  println!("digest = {:?}", digest);

  //prefix_byte = int(floor(random() if not random_float else random_float * 256))
  let prefix_byte = 0; // NB: This is bad code? floor(random) = 0 always.

  //assembled = bytes([prefix_byte]) + r + t + digest + bytes([3])

  let mut assembled = vec![prefix_byte];
  assembled.extend(r);
  assembled.extend(t);
  assembled.extend(digest);
  assembled.extend([3]);

  println!("assembled = {:?}", assembled);

  /*
        arr = bytearray(assembled)
        if len(arr) > 0:
            first = arr[0]
            for i in range(1, len(arr)):
                arr[i] = arr[i] ^ first
   */

  let mut arr = assembled.clone();

  // NB: Does not appear to be needed because the first byte is always "0" (for now)
  //if arr.len() > 0 {
  //  let first = *arr.get(0).ok_or(GrokClientError::BadSignatureInputs)?;
  //  for i in 1..arr.len() {
  //    let mut a = arr.get_mut(i).ok_or(GrokClientError::BadSignatureInputs)?;
  //    let av = *a;
  //    let bv = av ^ first;
  //    *a = bv;
  //  }
  //}

  println!("arr = {:?}", arr);

  // Uses + and /
  //encoded = b64encode(bytes(arr)).decode('ascii').replace('=', '')

  let encoded_bytes = BASE64_STANDARD.encode(arr);
  let encoded_bytes = encoded_bytes.replace("=", "");

  println!("encoded_bytes = {:?}", encoded_bytes);

  Ok(encoded_bytes)
}


#[cfg(test)]
mod tests {
  use crate::requests::index_page::index_parsers::parse_index_verification_token::VerificationToken;
  use crate::requests::index_page::signature::generate_sign_for_new_conversation::{generate_sign, GenerateSignArgs};
  use errors::AnyhowResult;

  #[test]
  fn test() -> AnyhowResult<()> {
    let ver = VerificationToken("yt16CWiUI42s7wGGeMxcdEIT2miPF5PVOGZF1Jcae7K7HMQrLeI4RTYufmdfBIZU".to_string());
    let svg_data = "M 10,30 C 147,16 51,222 136,87 h 31 s 177,77 40,114 C 68,166 18,188 114,44 h 220 s 148,210 202,25 C 220,36 246,218 12,120 h 244 s 34,154 56,161 C 211,204 208,60 174,14 h 155 s 157,116 220,95 C 116,164 53,210 174,232 h 139 s 148,151 135,221 C 167,196 118,27 149,247 h 233 s 129,238 113,21 C 73,44 215,158 218,29 h 68 s 13,98 243,134 C 44,98 149,35 20,178 h 163 s 219,104 41,152 C 237,107 118,120 127,117 h 57 s 41,167 43,136 C 116,168 44,246 182,209 h 143 s 238,93 237,119 C 142,36 64,67 97,111 h 71 s 230,247 119,27 C 206,56 158,51 71,115 h 135 s 120,186 74,57 C 197,165 180,214 102,16 h 88 s 252,48 189,166 C 163,237 57,253 154,60 h 96 s 84,56 15,66 C 177,101 10,202 185,227 h 29 s 204,55 115,219 C 103,82 127,143 194,99 h 102 s 179,63 84,110";

    let observed = generate_sign(GenerateSignArgs {
      path: "/rest/app-chat/conversations/new",
      method: "POST",
      verification_token: &ver,
      svg_data: &svg_data,
      numbers: &[40, 18, 3, 18],
    })?;

    let expected = "AMrdeglolCONrO8BhnjMXHRCE9pojxeT1ThmRdSXGnuyuxzEKy3iOEU2Ln5nXwSGVIkysQRoLOMjee3yLtjtJXbPVwjgAw";

    assert_eq!(&observed, expected);
    Ok(())
  }
}
