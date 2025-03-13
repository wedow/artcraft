use crate::events::notification_event::NotificationModelType;
use crate::state::app_dir::AppWeightsDir;
use std::path::PathBuf;

#[derive(Copy, Clone, Debug)]
pub enum ModelType {
  ClipJson,
  SdxlTurboUnet,
  SdxlTurboVae,
  SdxlTurboClipEncoder,
  SdxlTurboClipEncoder2,
  SimianLuoLcmDreamshaperV7Unet,
  LykonDreamshaper7Vae,
  LykonDreamshaper7TextEncoderFp16,
}

impl ModelType {
  pub fn get_name(&self) -> &'static str {
    match self {
      Self::ClipJson => "CLIP (JSON)",
      Self::SdxlTurboUnet => "SDXL Turbo UNET",
      Self::SdxlTurboVae => "SDXL Turbo VAE",
      Self::SdxlTurboClipEncoder => "Clip Encoder #1",
      Self::SdxlTurboClipEncoder2 => "Clip Encoder #2",
      Self::SimianLuoLcmDreamshaperV7Unet => "SimianLuo LCM Dreamshaper v7 UNET",
      Self::LykonDreamshaper7Vae => "Lykon Dreamshaper 7 VAE",
      Self::LykonDreamshaper7TextEncoderFp16 => "Lykon Dreamshaper Text Encoder (fp16)",
    }
  }

  pub fn get_notification_type(&self) -> NotificationModelType {
    match self {
      Self::ClipJson => NotificationModelType::Json,
      Self::SdxlTurboUnet => NotificationModelType::Unet,
      Self::SdxlTurboVae => NotificationModelType::Vae,
      Self::SdxlTurboClipEncoder => NotificationModelType::ClipEncoder,
      Self::SdxlTurboClipEncoder2 => NotificationModelType::ClipEncoder,
      Self::SimianLuoLcmDreamshaperV7Unet => NotificationModelType::Unet,
      Self::LykonDreamshaper7Vae => NotificationModelType::Vae,
      Self::LykonDreamshaper7TextEncoderFp16 => NotificationModelType::ClipEncoder,
    }
  }

  pub fn get_hf_id(&self) -> Option<&'static str> {
    match self {
      Self::ClipJson => Some("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k"),
      Self::SdxlTurboUnet 
      | Self::SdxlTurboVae
      | Self::SdxlTurboClipEncoder
      | Self::SdxlTurboClipEncoder2 => Some("stabilityai/sdxl-turbo"),
      Self::SimianLuoLcmDreamshaperV7Unet => Some("SimianLuo/LCM_Dreamshaper_v7"),
      Self::LykonDreamshaper7Vae
      | Self::LykonDreamshaper7TextEncoderFp16 => Some("Lykon/dreamshaper-7"),
    }
  }

  pub fn get_download_url(&self) -> &'static str {
    match self {
      Self::ClipJson => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/tokenizer.json",
      Self::SdxlTurboUnet => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/diffusion_pytorch_model.unet.safetensors",
      Self::SdxlTurboVae => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/diffusion_pytorch_model.vae.safetensors",
      Self::SdxlTurboClipEncoder => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/clip_text_encoder.safetensors",
      Self::SdxlTurboClipEncoder2 => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/clip_text_encoder_2.safetensors",
      Self::SimianLuoLcmDreamshaperV7Unet => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/simianluo_lcm_dreamshaper_v7_unet.safetensors",
      Self::LykonDreamshaper7Vae => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/lykon_dreamshaper_7_vae.safetensors",
      Self::LykonDreamshaper7TextEncoderFp16 => "https://pub-bc5e2bc0cdee4bb5ae8fca9d641ca0d6.r2.dev/lykon_dreamshaper_7_text_encoder.fp16.safetensors",
    }
  }

  pub fn get_filename(&self) -> &'static str {
    match self {
      Self::ClipJson => "clip_vit_bigg_14_lion2b_39b_b160k.tokenizer.json",
      Self::SdxlTurboUnet => "diffusion_pytorch_model.unet.safetensors",
      Self::SdxlTurboVae => "diffusion_pytorch_model.vae.safetensors",
      Self::SdxlTurboClipEncoder => "clip_text_encoder.safetensors",
      Self::SdxlTurboClipEncoder2 => "clip_text_encoder_2.safetensors",
      Self::SimianLuoLcmDreamshaperV7Unet => "simianluo_lcm_dreamshaper_v7_unet.safetensors",
      Self::LykonDreamshaper7Vae => "lykon_dreamshaper_7_vae.safetensors",
      Self::LykonDreamshaper7TextEncoderFp16 => "lykon_dreamshaper_7_text_encoder.fp16.safetensors",
    }
  }
  
  pub fn get_path(&self, weights_dir: &AppWeightsDir) -> PathBuf {
    weights_dir.model_path(self)
  }
}
