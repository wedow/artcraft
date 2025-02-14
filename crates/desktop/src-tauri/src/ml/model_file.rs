#[cfg(feature = "accelerate")]
extern crate accelerate_src;
#[cfg(feature = "mkl")]
extern crate intel_mkl_src;

use candle_transformers::models::stable_diffusion;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ModelFile {
  Tokenizer,
  Tokenizer2,
  Clip,
  Clip2,
  Unet,
  Vae,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StableDiffusionVersion {
  V1_5,
  V1_5Inpaint,
  V2_1,
  V2Inpaint,
  Xl,
  XlInpaint,
  Turbo,
}

impl StableDiffusionVersion {
  pub fn repo(&self) -> &'static str {
    match self {
      Self::XlInpaint => "diffusers/stable-diffusion-xl-1.0-inpainting-0.1",
      Self::Xl => "stabilityai/stable-diffusion-xl-base-1.0",
      Self::V2Inpaint => "stabilityai/stable-diffusion-2-inpainting",
      Self::V2_1 => "stabilityai/stable-diffusion-2-1",
      Self::V1_5 => "runwayml/stable-diffusion-v1-5",
      Self::V1_5Inpaint => "stable-diffusion-v1-5/stable-diffusion-inpainting",
      Self::Turbo => "stabilityai/sdxl-turbo",
    }
  }
}

impl ModelFile {
  pub fn get(
    &self,
    filename: Option<String>,
    version: StableDiffusionVersion,
    use_f16: bool,
  ) -> anyhow::Result<std::path::PathBuf> {
    use hf_hub::api::sync::Api;
    match filename {
      Some(filename) => Ok(std::path::PathBuf::from(filename)),
      None => {
        let (repo, path) = match self {
          Self::Tokenizer => {
            let tokenizer_repo = match version {
              StableDiffusionVersion::V1_5
              | StableDiffusionVersion::V2_1
              | StableDiffusionVersion::V1_5Inpaint
              | StableDiffusionVersion::V2Inpaint => "openai/clip-vit-base-patch32",
              StableDiffusionVersion::Xl
              | StableDiffusionVersion::XlInpaint
              | StableDiffusionVersion::Turbo => {
                "openai/clip-vit-large-patch14"
              }
            };
            (tokenizer_repo, "tokenizer.json")
          }
          Self::Tokenizer2 => {
            ("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k", "tokenizer.json")
          }
          Self::Clip => (version.repo(), "text_encoder/model.safetensors"),
          Self::Clip2 => (version.repo(), "text_encoder_2/model.safetensors"),
          Self::Unet => (version.repo(), "unet/diffusion_pytorch_model.safetensors"),
          Self::Vae => (version.repo(), "vae/diffusion_pytorch_model.safetensors"),
        };
        let filename = Api::new()?.model(repo.to_string()).get(path)?;
        Ok(filename)
      }
    }
  }
}

