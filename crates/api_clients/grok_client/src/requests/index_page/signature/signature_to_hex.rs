use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::signature::round_two_decimals::round_two_decimals;
/*
    @staticmethod
    def tohex(num: float) -> str:
        rounded = round(float(num), 2)
        if rounded == 0.0:
            return "0"
        sign = "-" if copysign(1.0, rounded) < 0 else ""
        absval = abs(rounded)
        intpart = int(floor(absval))
        frac = absval - intpart
        if frac == 0.0:
            return sign + format(intpart, "x")
        frac_digits = []
        f = frac
        for _ in range(20):
            f *= 16
            digit = int(floor(f + 1e-12))
            frac_digits.append(format(digit, "x"))
            f -= digit
            if abs(f) < 1e-12:
                break
        frac_str = "".join(frac_digits).rstrip("0")
        if frac_str == "":
            return sign + format(intpart, "x")
        return sign + format(intpart, "x") + "." + frac_str
 */

pub fn signature_to_hex(num: f64) -> Result<String, GrokClientError> {
  // rounded = round(float(num), 2)
  let rounded = round_two_decimals(num);

  println!("rounded = {}", rounded);

  if rounded == 0.0 {
    return Ok("0".to_string());
  }

  // sign = "-" if copysign(1.0, rounded) < 0 else ""
  let test = 1.0f64.copysign(rounded);
  let sign = if test < 0.0 { "-" } else { "" };

  println!("sign = {}", sign);

  let absval = rounded.abs();
  let intpart = absval.floor() as u32;

  println!("absval = {}", absval);
  println!("intpart = {}", intpart);

  let frac = absval - (intpart as f64);

  println!("frac = {}", frac);

  if frac == 0.0 {
    // return sign + format(intpart, "x") -- this is hex formatting
    let ret = format!("{sign}{intpart:x}");
    println!("return = {}", ret);
    return Ok(ret);
  }

  Ok("".to_string())
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::signature::signature_to_hex::signature_to_hex;

  #[test]
  fn test_1() {
    let num = 67.0;
    let output = signature_to_hex(num).unwrap();
    let expected = "43";

    assert_eq!(&output, expected);
  }
}
