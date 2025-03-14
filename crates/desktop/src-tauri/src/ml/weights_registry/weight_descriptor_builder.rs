use crate::ml::weights_registry::weight_descriptor::{WeightDescriptor, WeightFiletype, WeightFunction, WeightDescriptor2};
use const_format::concatcp;
const BUILDER_ERROR_MESSAGE : &str = "Program will not compile if builder isn't used correctly. Check that all arguments are passed to the builder.";

pub const R2_BUCKET_URL : &str = "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/";

/// r2_url!("foo.txt") --> https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/foo.txt (&'static str)
//macro_rules! r2_url {
//  ($ele: expr) => {
//    concatcp!(R2_BUCKET_URL, $ele)
//  };
//}

pub const fn maybe_filetype(url_or_filename: &'static str) -> Option<WeightFiletype> {
  const JSON : &[u8] = ".json".as_bytes();
  const SAFE_TENSORS: &[u8] = ".safetensors".as_bytes();
  let bytes = url_or_filename.as_bytes();

  // NB: This code is so onerous because there aren't any good string comparison `const fn`s.
  // Rust will stabilize those eventually: https://github.com/rust-lang/rust/issues/50899
  if let Some((_first, last)) = bytes.split_last_chunk::<5>() {
    match last as &[u8] {
      JSON => return Some(WeightFiletype::Json),
      _ => {}
    }
  }
  if let Some((_first, last)) = bytes.split_last_chunk::<12>() {
    match last as &[u8] {
      SAFE_TENSORS => return Some(WeightFiletype::SafeTensors),
      _ => {}
    }
  }
  None
}

macro_rules! weight {
    ($name: literal, $file_name:literal, $weight_function:expr) => {
      WeightDescriptor {
        name: $name,
        filename: $file_name,
        r2_download_url: const_format::concatcp!(crate::ml::weights_registry::weight_descriptor_builder::R2_BUCKET_URL, $file_name),
        filetype: crate::ml::weights_registry::weight_descriptor_builder::maybe_filetype($file_name).expect("SHOULD WORK"),
        function: $weight_function,
      }
    };
}

pub(crate) use weight;

#[derive(Default)]
pub(super) struct WeightBuilder {
  name: Option<&'static str>,
  filename: Option<&'static str>,
  r2_download_url: Option<&'static str>,
  filetype: Option<WeightFiletype>,
  function: Option<WeightFunction>,
}

impl WeightBuilder {
  pub (super) const fn name(name: &'static str) -> Self {
    Self {
      name: Some(name),
      filename: None,
      r2_download_url: None,
      filetype: None,
      function: None,
    }
  }
  pub (super) const fn filetype(self, filetype: WeightFiletype) -> Self {
    Self {
      filetype: Some(filetype),
      .. self
    }
  }
  pub (super) const fn function(self, weight_classification: WeightFunction) -> Self {
    Self {
      function: Some(weight_classification),
      .. self
    }
  }
  pub (super) const fn filename(self, filename: &'static str) -> Self {
     Self {
       filename: Some(filename),
       r2_download_url: Some("todo"),
       filetype: Some(WeightFiletype::Json),
       .. self
     }
  }
  //pub (super) const fn filename(self, filename: &'static str) -> Self {
  //  let s = ConstStr::new().append_str(R2_BUCKET_URL).append_str(filename);
  //  let url = s.as_str();
  //  Self {
  //    r2_download_url: Some(url),
  //    .. self
  //  }
  //}
  pub (super) const fn r2_download_url(self, r2_download_url: &'static str) -> Self {
    let maybe_filetype = maybe_filetype(r2_download_url);
    match maybe_filetype {
      Some(filetype) => {
        Self {
          r2_download_url: Some(r2_download_url),
          filetype: Some(filetype),
          .. self
        }
      },
      None => {
        Self {
          r2_download_url: Some(r2_download_url),
          .. self
        }
      }
    }
  }
  pub (super) const fn build(self) -> WeightDescriptor {
    WeightDescriptor {
      name: self.name.expect(BUILDER_ERROR_MESSAGE),
      filename: self.filename.expect(BUILDER_ERROR_MESSAGE),
      r2_download_url: self.r2_download_url.expect(BUILDER_ERROR_MESSAGE),
      filetype: self.filetype.expect(BUILDER_ERROR_MESSAGE),
      function: self.function.expect(BUILDER_ERROR_MESSAGE),
    }
  }
}


const BUFFER_SIZE : usize = 8192;

/// This is a hack since we can't use macros to append &'static str variables, nor have const generics landed.
struct ConstStr {
  data: [u8; BUFFER_SIZE],
  len: usize,
}

impl ConstStr {
  pub const fn new() -> Self {
    Self {
      data: [0u8; BUFFER_SIZE],
      len: 0,
    }
  }

  pub const fn append_str(mut self, s: &str) -> Self {
    let b = s.as_bytes();
    let mut index = 0;
    while index < b.len() {
      self.data[self.len] = b[index];
      self.len += 1;
      index += 1;
    }
    self
  }

  pub const fn as_str<'a>(&'a self) -> &'a str {
    let mut data: &[u8] = &self.data;
    let mut n = data.len() - self.len;
    while n > 0 {
      n -= 1;
      match data.split_last() {
        Some((_, rest)) => data = rest,
        None => panic!(),
      }
    }
    unsafe { std::str::from_utf8_unchecked(data) }
  }
}