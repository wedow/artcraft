

use super::file_descriptor::FileDescriptor;
use crate::remote_file_manager::weights_descriptor::{WeightsLoRADescriptor, WeightsSD15Descriptor, WeightsSDXLDescriptor, self};

pub struct RemoteCloudBucketDetails {
    pub object_hash: String,
    pub prefix: String,
    pub suffix: String,
}

impl RemoteCloudBucketDetails {
    pub fn new(object_hash: String, prefix: String, suffix: String) -> Self {
        Self {
            object_hash: object_hash,
            prefix: prefix,
            suffix: suffix
        }
    }
    pub fn get_object_hash(&self) -> &str {
        &self.object_hash
    }
    pub fn get_prefix(&self) -> &str {
        &self.prefix
    }
    pub fn get_suffix(&self) -> &str {
        &self.suffix
    }

    pub fn file_descriptor_from_bucket_details(&self) -> Box<dyn FileDescriptor> {
        match self.prefix.as_str() {
            "loRA" => Box::new(weights_descriptor::WeightsLoRADescriptor {}),
            "sd15" => Box::new(weights_descriptor::WeightsSD15Descriptor {}),
            "sdxl" => Box::new(weights_descriptor::WeightsSDXLDescriptor {}),
            "valle_prompt" => Box::new(weights_descriptor::WeightsVallePromptDescriptor {}),
            "rvc" => {
                match self.suffix.as_str() {
                    "safetensors" => Box::new(weights_descriptor::WeightsRVCDescriptor {}),
                    "index" => Box::new(weights_descriptor::WeightsRVCIndexDescriptor {}),
                    _ => panic!("Unknown suffix: {}",self.suffix)
                }
            },
            "svc" => Box::new(weights_descriptor::WeightsSVCDescriptor {}),
            _ => panic!("Unknown prefix: {}", self.prefix)
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    pub fn test() {

    }
 
}