use crate::ml::weights_registry::weight_descriptor::WeightFiletype;
pub (super) const BUILDER_ERROR_MESSAGE : &str = "Program will not compile if builder isn't used correctly. Check that all arguments are passed to the builder.";

pub (super) const R2_BUCKET_URL : &str = "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/";

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
      $crate::ml::weights_registry::weight_descriptor::WeightDescriptor {
        name: $name,
        filename: $file_name,
        r2_download_url: const_format::concatcp!(crate::ml::weights_registry::weight_descriptor_builder::R2_BUCKET_URL, $file_name),
        filetype: $crate::ml::weights_registry::weight_descriptor_builder::maybe_filetype($file_name)
          .expect($crate::ml::weights_registry::weight_descriptor_builder::BUILDER_ERROR_MESSAGE),
        function: $weight_function,
      }
    };
}

pub(crate) use weight;
