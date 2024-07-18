use std::collections::HashMap;

use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;


#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct GptSovitsPayload {
  #[serde(rename = "ti")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_title: Option<String>,

  #[serde(rename = "de")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub maybe_description: Option<String>,

  #[serde(rename = "cv")]
  #[serde(skip_serializing_if = "Option::is_none")]
  pub creator_visibility: Option<Visibility>,
}
