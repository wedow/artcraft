use crate::ml::weights_registry::weight_descriptor::{WeightDescriptor, WeightFunction};
use crate::ml::weights_registry::weight_descriptor_builder::WeightBuilder;

use crate::ml::weights_registry::weight_descriptor_builder::weight;

pub const CLIP_JSON : WeightDescriptor = WeightBuilder::name("CLIP")
  .filename("clip_vit_bigg_14_lion2b_39b_b160k.tokenizer.json")
  .function(WeightFunction::TextTokenizer)
  .build();

#[deprecated]
pub const SDXL_TURBO_CLIP_TEXT_ENCODER : WeightDescriptor = WeightBuilder::name("SDXL Turbo CLIP")
  .filename("clip_text_encoder.safetensors")
  .function(WeightFunction::TextEncoder)
  .build();

/// For LCM-based image generation
pub const LYKON_DEAMSHAPER_7_TEXT_ENCODER_FP16 : WeightDescriptor = WeightBuilder::name("Lykon Dreamshaper 7")
  .filename("lykon_dreamshaper_7_text_encoder.fp16.safetensors")
  .function(WeightFunction::TextEncoder)
  .build();

/// For LCM-based image generation
pub const LYKON_DEAMSHAPER_7_VAE : WeightDescriptor = weight!(
  "Lykon Dreamshaper 7",
  "lykon_dreamshaper_7_vae.safetensors",
  WeightFunction::Vae
);

/// For LCM-based image generation
pub const SIMIANLUO_LCM_DREAMSHAPER_V7_UNET : WeightDescriptor = weight!(
  "SimianLuo LCM Dreamshaper v7",
  "simianluo_lcm_dreamshaper_v7_unet.safetensors",
  WeightFunction::Unet
);
