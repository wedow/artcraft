use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::signature::signature_xa::signature_xa;
/*
    @staticmethod
    def xs(x_bytes: bytes, svg: str, x_values: list) -> str:
        arr = list(x_bytes) -- we already have this
        idx = arr[x_values[0]] % 16
        c = ((arr[x_values[1]] % 16) * (arr[x_values[2]] % 16)) * (arr[x_values[3]] % 16)
        o = Signature.xa(svg)
        vals = o[idx]
        k = Signature.simulateStyle(vals, c)

        concat = str(k["color"]) + str(k["transform"])
        matches = findall(r"[\d\.\-]+", concat)
        converted = []
        for m in matches:
            num = float(m)
            hexstr = Signature.tohex(num)
            converted.append(hexstr)
        joined = "".join(converted)
        cleaned = joined.replace(".", "").replace("-", "")
        return cleaned
 */

/// Based on "Grok-Api/core/xctid.py"
/// `bytes` is
/// `svg_data` is the <path d="" /> svg path stroke data
/// `x_values` are the magic numbers from the script
pub fn signature_xs(x_bytes: &[u8], svg_data: &str, x_values: &[u8]) -> Result<String, GrokClientError> {
  /*
Inputs:
> xs.x_bytes = b'\xca\xddz\th\x94#\x8d\xac\xef\x01\x86x\xcc\\tB\x13\xdah\x8f\x17\x93\xd58fE\xd4\x97\x1a{\xb2\xbb\x1c\xc4+-\xe28E6.~g_\x04\x86T'
> xs.svg = M 10,30 C 147,16 51,222 136,87 h 31 s 177,77 40,114 C 68,166 18,188 114,44 h 220 s 148,210 202,25 C 220,36 246,218 12,120 h 244 s 34,154 56,161 C 211,204 208,60 174,14 h 155 s 157,116 220,95 C 116,164 53,210 174,232 h 139 s 148,151 135,221 C 167,196 118,27 149,247 h 233 s 129,238 113,21 C 73,44 215,158 218,29 h 68 s 13,98 243,134 C 44,98 149,35 20,178 h 163 s 219,104 41,152 C 237,107 118,120 127,117 h 57 s 41,167 43,136 C 116,168 44,246 182,209 h 143 s 238,93 237,119 C 142,36 64,67 97,111 h 71 s 230,247 119,27 C 206,56 158,51 71,115 h 135 s 120,186 74,57 C 197,165 180,214 102,16 h 88 s 252,48 189,166 C 163,237 57,253 154,60 h 96 s 84,56 15,66 C 177,101 10,202 185,227 h 29 s 204,55 115,219 C 103,82 127,143 194,99 h 102 s 179,63 84,110
> xs.x_values = [40, 18, 3, 18]
Arr becomes:
xs.arr = [202, 221, 122, 9, 104, 148, 35, 141, 172, 239, 1, 134, 120, 204, 92, 116, 66, 19, 218, 104, 143, 23, 147, 213, 56, 102, 69, 212, 151, 26, 123, 178, 187, 28, 196, 43, 45, 226, 56, 69, 54, 46, 126, 103, 95, 4, 134, 84]
   */

  // arr = list(x_bytes) -- we already have this as the input
  let arr = x_bytes;

  // idx = arr[x_values[0]] % 16
  let i = x_values.get(0).map(|x| *x as usize).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let a = arr.get(i).map(|x| *x).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let idx = a % 16;

  println!("idx = {}", idx);

  // c = ((arr[x_values[1]] % 16) * (arr[x_values[2]] % 16)) * (arr[x_values[3]] % 16)
  let xv1 = ith_usize(x_values, 1)?;
  let av1 = ith_u32(arr, xv1)? % 16;
  let xv2 = ith_usize(x_values, 2)?;
  let av2 = ith_u32(arr, xv2)? % 16;
  let xv3 = ith_usize(x_values, 3)?;
  let av3 = ith_u32(arr, xv3)? % 16;
  let c = av1 * av2 * av3; // Max value: 4096 (16x16x16)

  println!("c = {}", c);

  // o = Signature.xa(svg)
  let o = signature_xa(svg_data)?;

  // vals = o[idx]
  let vals = o.get(idx as usize).ok_or_else(|| GrokClientError::BadSignatureInputs)?;

  // > xs.vals.len = 11
  // > xs.vals = [73, 44, 215, 158, 218, 29, 68, 13, 98, 243, 134]
  println!("vals.len = {:?}", vals.len());
  println!("vals = {:?}", vals);


  Ok("".to_string())
}

fn ith_usize(bytes: &[u8], i: usize) -> Result<usize, GrokClientError> {
  bytes.get(i)
      .map(|x| *x as usize)
      .ok_or_else(|| GrokClientError::BadSignatureInputs)
}

fn ith_u32(bytes: &[u8], i: usize) -> Result<u32, GrokClientError> {
  bytes.get(i)
      .map(|x| *x as u32)
      .ok_or_else(|| GrokClientError::BadSignatureInputs)
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::signature::signature_xs::signature_xs;

  #[test]
  fn test() {
    let x_bytes = [202, 221, 122, 9, 104, 148, 35, 141, 172, 239, 1, 134, 120, 204, 92, 116, 66, 19, 218, 104, 143, 23, 147, 213, 56, 102, 69, 212, 151, 26, 123, 178, 187, 28, 196, 43, 45, 226, 56, 69, 54, 46, 126, 103, 95, 4, 134, 84];
    let svg_data = "M 10,30 C 147,16 51,222 136,87 h 31 s 177,77 40,114 C 68,166 18,188 114,44 h 220 s 148,210 202,25 C 220,36 246,218 12,120 h 244 s 34,154 56,161 C 211,204 208,60 174,14 h 155 s 157,116 220,95 C 116,164 53,210 174,232 h 139 s 148,151 135,221 C 167,196 118,27 149,247 h 233 s 129,238 113,21 C 73,44 215,158 218,29 h 68 s 13,98 243,134 C 44,98 149,35 20,178 h 163 s 219,104 41,152 C 237,107 118,120 127,117 h 57 s 41,167 43,136 C 116,168 44,246 182,209 h 143 s 238,93 237,119 C 142,36 64,67 97,111 h 71 s 230,247 119,27 C 206,56 158,51 71,115 h 135 s 120,186 74,57 C 197,165 180,214 102,16 h 88 s 252,48 189,166 C 163,237 57,253 154,60 h 96 s 84,56 15,66 C 177,101 10,202 185,227 h 29 s 204,55 115,219 C 103,82 127,143 194,99 h 102 s 179,63 84,110";
    let x_values = [40, 18, 3, 18];

    signature_xs(&x_bytes, &svg_data, &x_values).unwrap();

    assert_eq!(1,2);
  }
}
