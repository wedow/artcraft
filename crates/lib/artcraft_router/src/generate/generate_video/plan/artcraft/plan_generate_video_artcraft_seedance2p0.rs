use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount,
};

pub struct PlanArtcraftSeedance2p0<'a> {
  pub prompt: Option<&'a str>,
  pub start_frame: Option<ImageRef<'a>>,
  pub end_frame: Option<ImageRef<'a>>,
  pub reference_images: Option<ImageListRef<'a>>,
  pub aspect_ratio: Option<Seedance2p0AspectRatio>,
  pub duration_seconds: Option<u8>,
  pub batch_count: Seedance2p0BatchCount,
  pub idempotency_token: String,
}

// Aspect ratio values (width / height) for ordering:
//   Portrait9x16 = 0.5625, Portrait3x4 = 0.75, Square1x1 = 1.0, Standard4x3 = 1.33, Landscape16x9 = 1.78

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance2p0AspectRatio>, ArtcraftRouterError> {
  match aspect_ratio {
    // No preference or auto — let the model decide
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    // Direct mappings
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(Seedance2p0AspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(Seedance2p0AspectRatio::Portrait9x16))
    }
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(Seedance2p0AspectRatio::Square1x1))
    }
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Seedance2p0AspectRatio::Standard4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Seedance2p0AspectRatio::Portrait3x4)),

    // Mismatches — apply strategy
    Some(unsupported) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", unsupported),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        Ok(Some(aspect_ratio_upgrade(unsupported)))
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        Ok(Some(aspect_ratio_downgrade(unsupported)))
      }
    },
  }
}

/// Round an unsupported aspect ratio up toward a higher AR (wider / less portrait).
fn aspect_ratio_upgrade(aspect_ratio: CommonAspectRatio) -> Seedance2p0AspectRatio {
  match aspect_ratio {
    // Wide mismatches: round up to the next wider supported ratio
    CommonAspectRatio::WideFiveByFour => Seedance2p0AspectRatio::Standard4x3,    // 1.25 → 1.33
    CommonAspectRatio::WideThreeByTwo => Seedance2p0AspectRatio::Landscape16x9,  // 1.50 → 1.78
    CommonAspectRatio::WideTwentyOneByNine => Seedance2p0AspectRatio::Landscape16x9, // 2.33 → 1.78 (max)
    // Tall mismatches: round up toward Square (higher AR = less portrait)
    CommonAspectRatio::TallFourByFive => Seedance2p0AspectRatio::Square1x1,     // 0.80 → 1.00
    CommonAspectRatio::TallTwoByThree => Seedance2p0AspectRatio::Portrait3x4,   // 0.67 → 0.75
    CommonAspectRatio::TallNineByTwentyOne => Seedance2p0AspectRatio::Portrait9x16, // 0.43 → 0.56 (max portrait)
    _ => Seedance2p0AspectRatio::Square1x1,
  }
}

/// Round an unsupported aspect ratio down toward a lower AR (narrower / more portrait).
fn aspect_ratio_downgrade(aspect_ratio: CommonAspectRatio) -> Seedance2p0AspectRatio {
  match aspect_ratio {
    // Wide mismatches: round down to the next narrower supported ratio
    CommonAspectRatio::WideFiveByFour => Seedance2p0AspectRatio::Square1x1,     // 1.25 → 1.00
    CommonAspectRatio::WideThreeByTwo => Seedance2p0AspectRatio::Standard4x3,   // 1.50 → 1.33
    CommonAspectRatio::WideTwentyOneByNine => Seedance2p0AspectRatio::Landscape16x9, // 2.33 → 1.78 (only option)
    // Tall mismatches: round down toward most portrait (lower AR)
    CommonAspectRatio::TallFourByFive => Seedance2p0AspectRatio::Portrait3x4,   // 0.80 → 0.75
    CommonAspectRatio::TallTwoByThree => Seedance2p0AspectRatio::Portrait9x16,  // 0.67 → 0.56
    CommonAspectRatio::TallNineByTwentyOne => Seedance2p0AspectRatio::Portrait9x16, // 0.43 → 0.56 (only option)
    _ => Seedance2p0AspectRatio::Square1x1,
  }
}

fn plan_batch_count(
  video_batch_count: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Seedance2p0BatchCount, ArtcraftRouterError> {
  let count = video_batch_count.unwrap_or(1);
  match count {
    1 => Ok(Seedance2p0BatchCount::One),
    2 => Ok(Seedance2p0BatchCount::Two),
    4 => Ok(Seedance2p0BatchCount::Four),
    _ => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "video_batch_count",
          value: format!("{}", count),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => {
        // Round up to the next supported count; clamp at 4
        if count == 0 {
          Ok(Seedance2p0BatchCount::One)
        } else if count < 4 {
          Ok(Seedance2p0BatchCount::Four)
        } else {
          Ok(Seedance2p0BatchCount::Four)
        }
      }
      RequestMismatchMitigationStrategy::PayLessDowngrade => {
        // Round down to the previous supported count; clamp at 4 for overflows
        if count == 0 {
          Ok(Seedance2p0BatchCount::One)
        } else if count < 4 {
          Ok(Seedance2p0BatchCount::Two)
        } else {
          Ok(Seedance2p0BatchCount::Four)
        }
      }
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<u8>, ArtcraftRouterError> {
  const MIN: u16 = 4;
  const MAX: u16 = 15;
  match duration_seconds {
    None => Ok(None),
    Some(d) if d >= MIN && d <= MAX => Ok(Some(d as u8)),
    Some(d) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", d),
        }))
      }
      _ => Ok(Some(d.clamp(MIN, MAX) as u8)),
    },
  }
}

pub fn plan_generate_video_artcraft_seedance2p0<'a>(
  request: &'a GenerateVideoRequest<'a>,
) -> Result<PlanArtcraftSeedance2p0<'a>, ArtcraftRouterError> {
  let strategy = request.request_mismatch_mitigation_strategy;
  let aspect_ratio = plan_aspect_ratio(request.aspect_ratio, strategy)?;
  let batch_count = plan_batch_count(request.video_batch_count, strategy)?;
  let duration_seconds = plan_duration(request.duration_seconds, strategy)?;

  Ok(PlanArtcraftSeedance2p0 {
    prompt: request.prompt,
    start_frame: request.start_frame,
    end_frame: request.end_frame,
    reference_images: request.reference_images,
    aspect_ratio,
    duration_seconds,
    batch_count,
    idempotency_token: request.get_or_generate_idempotency_token(),
  })
}
