use serde_derive::{Deserialize, Serialize};

/// This is a comprehensive list of common aspect ratios.
/// Not every model will support every aspect ratio.
/// In the case a model doesn't support the aspect ratio, pick the nearest option.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonAspectRatio {
  // Auto (eg. for image editing to use the source; used by Nano Banana Pro edit image, but not text-to-image)
  Auto,

  // Square
  Square,

  // Wide
  WideFiveByFour,
  WideFourByThree,
  WideThreeByTwo,
  WideSixteenByNine,
  WideTwentyOneByNine,

  // Tall
  TallFourByFive,
  TallThreeByFour,
  TallTwoByThree,
  TallNineBySixteen,
  TallNineByTwentyOne,

  // Imprecise semantic values that we probably remap to other meanings
  // on a model-by-model basis.
  Wide,
  Tall,

  //Possible enum values: square_hd, square,
  // portrait_4_3, portrait_16_9, landscape_4_3, landscape_16_9,
  // auto, auto_2K, auto_4K

  // Auto values that bake in resolution
  Auto2k,
  Auto4k,

  // Defined aspect ratios that bake in resolution
  SquareHd,
}
