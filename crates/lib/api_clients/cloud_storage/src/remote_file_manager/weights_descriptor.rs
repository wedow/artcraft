use super::file_descriptor::FileDescriptor;

pub struct WeightsLoRADescriptor {}

const REMOTE_FILE_DIRECTORY: &str = "/weights";

impl FileDescriptor for WeightsLoRADescriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       return "safetensors".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, loRA, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        return "loRA".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}

pub struct WeightsSD15Descriptor {}

impl FileDescriptor for WeightsSD15Descriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       return "safetensors".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        return "sd15".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}


pub struct WeightsSDXLDescriptor {}

impl FileDescriptor for WeightsSDXLDescriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
       return "safetensors".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end 
    fn get_prefix(&self)->String {
        return "sdxl".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
      true
    }
}

pub struct WeightsSVCDescriptor {}

impl FileDescriptor for crate::remote_file_manager::weights_descriptor::WeightsSVCDescriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        return "safetensors".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        return "svc".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsRVCDescriptor {}

impl FileDescriptor for crate::remote_file_manager::weights_descriptor::WeightsRVCDescriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        return "pth".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        return "rvc".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsRVCIndexDescriptor {}

impl FileDescriptor for crate::remote_file_manager::weights_descriptor::WeightsRVCIndexDescriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        return "index".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        return "rvc".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}

pub struct WeightsVallePromptDescriptor {}

impl FileDescriptor for crate::remote_file_manager::weights_descriptor::WeightsVallePromptDescriptor {
    fn remote_directory_path(&self) -> &str {
        return REMOTE_FILE_DIRECTORY;
    }
    // this will be the type of file peroid is handled by the file formatter
    // e.g safetensors bin jpg
    fn get_suffix(&self)->String {
        return "safetensors".to_string();
    }
    // This will be the prefix of the media type or the weights type.
    // name of the weights or the name of the media type
    // vall-e_prompt, SD15, sd15, sdxl when implmenting add to the end
    fn get_prefix(&self)->String {
        return "valle_prompt".to_string();
    }

    // This will be ensure that the right bucket is picked
    fn is_public(&self) -> bool {
        true
    }
}