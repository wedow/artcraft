use std::vec;

use log::info;
use sqlx::{MySql, Pool};

use enums::by_table::model_weights::{
    weights_category::WeightsCategory,
    weights_types::WeightsType,
};
use enums::common::visibility::Visibility;
use errors::{anyhow, AnyhowResult};
use mysql_queries::queries::model_weights::create::create_weight::{create_weight, CreateModelWeightsArgs};
use mysql_queries::queries::users::user::get_user_token_by_username::get_user_token_by_username;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::seeding::users::HANASHI_USERNAME;

pub async fn seed_weights_for_paging(mysql_pool: &Pool<MySql>, user_token: UserToken) -> AnyhowResult<()> {
    let sd1_5_markdown_description = r#"
# Dragonfruit AI Models Update and Workflow

## Last Update for Dragonfruit Models
- **Note:** This might be the last update for a while, focusing next on a realistic merge (WIP).
- **Future Plans:** Possible update to Z.5D v2 after completing the realistic merge.

## New Models Announcement
- **Upcoming Models:** Separate from the Dragonfruit branch, so stay tuned!

## DragonfruitGT v1 (Z v2)
- **Focus:** More fantasy, richer color range, improved landscapes, more masculine men.
- **Alternative:** Use DragonfruitOG v2.0 for thicker lines, simpler colors.

## GT v1.0 (Z v2.0) Features
- Improved backgrounds
- Deeper contrast and color
- Bolder lines and more detail

### Settings for GT
- Steps: 30-50
- Clip skip: 2
- Upscaler: Euler a / DPM++ 2M SDE Karras
- Extensions: Adetailer, VAE: berrysmix

## Workflow for Images
1. **BerryMix VAE:** Ensure correct color.
2. **Adetailer Extension:** Improve faces, bodies, and hands. Also available on Civitai and Huggingface.
3. **Hires Fix:** Denoising strength 0.3 - 0.35, using upscaler "x_NMKD-Superscale-SP_178000_G".
4. **Img2img Transfer:** Use denoising strength 0.3-0.35 with the same prompt and settings. Adjust height after hires.
5. **Second Img2img Transfer:** Low denoising strength 0.1-3.0. Use SD upscale script with "RealESRGAN_x4plus_anime_6B" sampler for size increase.

## DragonfruitZ.5D v1.0
- **Style:** 2.5D model, merging DragonfruitZ with realistic elements.
- **Features:** Skin color variety, masculine men, landscapes, fantasy, NSFW content, detailed faces.

### Settings for Z.5D
- Steps: 30
- Clip skip: 2
- Upscaler: Euler a
- Extensions: Adetailer, VAE: berrysmix

## DragonfruitOG v2.0
- **Refinement:** Of the original Dragonfruit model.
- **Style:** Bold, clean lines and bold colors with decreased detail for simplicity.
- **Improvements:** Teeth, skin color variety, landscapes, fantasy elements, NSFW content.

## DragonfruitZ v1.0
- **Alternative Version:** More fantasy and color range, better landscapes, more masculine men.
- **Suggestion:** Use Dragonfruit (Unisex) v2 for thicker lines and simpler colors.

## Dragonfruit OG v1.0
- **Focus:** More unisex, suitable for creating male characters.
- **Personal Note:** First merge, aimed at 2D, flat, colorful, thick lined styles.

### Personal Settings
- Steps: 20-30
- Clip skip: 2
- Upscaler: Euler a / DPM++ 2M SDE Karras
- Extensions: Adetailer, VAE: berrysmix

*Thank you for your continued support and feedback!*
"#;

    let sd1_5_image_token = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/be706282-2978-42a0-aaa2-73881aad94e9/width=1024/00049-2287632957-1girl,face,curly%20hair,red%20hair,white%20background,.jpeg";

    // create a loop that loops from 1 to 100
    for i in 1..=100 {
        // create a new weight
        
        let weights_category = match i {
            1..=20 => WeightsCategory::VoiceConversion,
            21..=40 => WeightsCategory::TextToSpeech,
            41..=60 => WeightsCategory::ImageGeneration,
            61..=80 => WeightsCategory::ImageGeneration,
            81..=100 => WeightsCategory::ImageGeneration,
            _ => WeightsCategory::ImageGeneration
        };

        let weights_types = match i {
            1..=20 => WeightsType::RvcV2,
            21..=40 => WeightsType::HifiganTacotron2,
            41..=60 => WeightsType::StableDiffusion15,
            61..=80 => WeightsType::StableDiffusionXL,
            81..=100 => WeightsType::LoRA,
            _ => WeightsType::LoRA
        };

        let mut model_weight_token;
        let mut title;
        let mut description;
        let mut description_rendered_html;
        let mut original_filename;
        let mut original_download_url;
        let mut thumbnail_token;
        
        let mut private_bucket_hash:String = "".to_string();
        let mut private_bucket_prefix;
        let mut private_bucket_extension;

        let mut cached_user_ratings_total_count;
        let mut cached_user_ratings_positive_count;
        let mut cached_user_ratings_negative_count;
        let mut cached_user_ratings_ratio;
        let mut version;

        match i {
            1..=20 => {
                // voice conversion model
                let rvc_markdown_description = r#"
                # RVC v2
                - **Improved Quality:** The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.
                - Gawr Gura MOS 4
                "#;

                model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
                title = format!("Gawr Gura: {}", i);
                description = format!("Description Number {} The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.", i);
                description_rendered_html = rvc_markdown_description;
                
                original_filename = format!("gura_gwar{}.safetensors", i);
                original_download_url = format!("www.google.ca");

                // NOTE TO SELF this will be a join for later on for now they can use this.
                thumbnail_token = "";
                
                // private_bucket_hash = format!("bucket_hash{}", i);
                private_bucket_prefix = format!("_fake");
                private_bucket_extension = format!("rvcV2");
                cached_user_ratings_total_count = i;
                cached_user_ratings_positive_count = i;
                cached_user_ratings_negative_count = i;
                cached_user_ratings_ratio = i as u32 / 100;
                version = i as i32;
                println!("Seeding RVCv2 model {}", i);
            },
            21..=40 =>{
                // TTS
                model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
                title = format!("dragonfruitGTv1: {}", i);
                
                description = format!("Description Number {}:", i);
            
                let tts_markdown_description = r#"
                # HifiGAN Tacotron2
                - **Improved Quality:** The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.
                - Goku MOS 4
                "#;

                description_rendered_html = tts_markdown_description;
                
                original_filename = format!("filename{}.txt", i);
                original_download_url = format!("https://civitai.com/api/download/models/149193?type=Model&format=SafeTensor&size=pruned&fp=fp16");

                // NOTE TO SELF this will be a join for later on for now they can use this.
                thumbnail_token = "";
                
                // private_bucket_hash = format!("bucket_hash{}", i);
                private_bucket_prefix = format!("_fake");
                private_bucket_extension = format!("tt2");

                cached_user_ratings_total_count = i;
                cached_user_ratings_positive_count = i;
                cached_user_ratings_negative_count = i;
                cached_user_ratings_ratio = i as u32 / 100;
                version = i as i32;
                println!("Seeding TT2 model {}", i);
            },
            41..=60 => {
                // SD 1.5
                model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
                title = format!("dragonfruitGTv1: {}", i);
                
                description = format!("Description Number {}:", i);
                
                description_rendered_html = sd1_5_markdown_description;
                
                original_filename = format!("filename{}.txt", i);
                original_download_url = format!("https://civitai.com/api/download/models/149193?type=Model&format=SafeTensor&size=pruned&fp=fp16");

                // NOTE TO SELF this will be a join for later on for now they can use this.
                thumbnail_token = ""; //sd1_5_image_token;
                 
                // private_bucket_hash = format!("bucket_hash{}", i);
                private_bucket_prefix = format!("_fake");
                private_bucket_extension = format!("sd15");

                cached_user_ratings_total_count = i;
                cached_user_ratings_positive_count = i;
                cached_user_ratings_negative_count = i;
                cached_user_ratings_ratio = i as u32 / 100;
                version = i as i32;
                println!("Seeding SD15 model {}", i);
            },
            61..=80 => {
                // SD XL
                let sdxl_markdown_description = r#"
                # Special Edition Release Announcement

                ## What's New?
                - **Improved Quality:** The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.

                ## Tips for Use
                1. **Simple Prompts:** Avoid adding words like "detailed, realistic..." or specifying a specific artist. Simply describe what you want to see.
                2. **CFG Scale:** A range between 3 and 8.5 is effective (recommended: 7).
                3. **Minimum Steps:** Ensure at least 36 steps for optimal results.
                4. **Compatibility:**
                - Works excellently with Hires fix.
                - Great results with unaestheticXLv31 embedding, although sometimes better without it.
                5. **Sampling Method:** Either DPM++ 2M SDE Karras or DPM++ 2M Karras.

                Have fun! 😊
                "#;
                let sdxl_image_token = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/be706282-2978-42a0-aaa2-73881aad94e9/width=1024/00049-2287632957-1girl,face,curly%20hair,red%20hair,white%20background,.jpeg";

                model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
                title = format!("SDXL_Niji_Special Edition: {}", i);
                description = format!("Description Number {}:", i);

                // private_bucket_hash = format!("bucket_hash{}", i);
                private_bucket_prefix = format!("_fake");
                private_bucket_extension = format!("sdxl");
  
                description_rendered_html = sdxl_markdown_description;
                  
                original_filename = format!("filename{}.txt", i);
                original_download_url = format!("https://civitai.com/api/download/models/149193?type=Model&format=SafeTensor&size=pruned&fp=fp16");
  
                // NOTE TO SELF this will be a join for later on for now they can use this.
                thumbnail_token = "";

                cached_user_ratings_total_count = i;
                cached_user_ratings_positive_count = i;
                cached_user_ratings_negative_count = i;
                cached_user_ratings_ratio = i as u32 / 100;
                version = i as i32;
                println!("Seeding SDXL model {}", i);
            },
            81..=100 => {
                // LoRA
                let lora_markdown_description = r#"
                - **Improved Quality:** The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.
                - LoRA Gawr Gura
                "#;

                let lora_image_token = "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/123645df-dee2-4239-863a-76a150b09c32/width=1024/00000-2171948503.jpeg";
                model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
                title = format!("Gawr Gura LoRA: {}", i);
                
                description = format!("Description Number {}:", i);

                description_rendered_html = lora_markdown_description;
                
                original_filename = format!("filename{}.txt", i);
                original_download_url = format!("https://civitai.com/api/download/models/149193?type=Model&format=SafeTensor&size=pruned&fp=fp16");

                // NOTE TO SELF this will be a join for later on for now they can use this.
                thumbnail_token = ""; // lora_image_token;
                
                // private_bucket_hash = format!("bucket_hash{}", i);
                private_bucket_prefix = format!("_fake");
                private_bucket_extension = format!("loRA");

                cached_user_ratings_total_count = i;
                cached_user_ratings_positive_count = i;
                cached_user_ratings_negative_count = i;
                cached_user_ratings_ratio = i as u32 / 100;
                version = i as i32;
                println!("Seeding LoRA model {}", i);
            },
            _ => {
                // We went out of range so have more gwar gura
                let rvc_markdown_description = r#"
                # RVC v2
                - **Improved Quality:** The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.
                - Gawr Gura MOS 4
                "#;

                model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
                title = format!("Gawr Gura: {}", i);
                description = format!("Description Number {} The special edition offers significantly better quality with fewer issues. It's the model as initially envisioned.", i);
                description_rendered_html = rvc_markdown_description;
                
                original_filename = format!("gura_gwar{}.safetensors", i);
                original_download_url = format!("www.google.ca");

                // NOTE TO SELF this will be a join for later on for now they can use this.
                thumbnail_token = "";
                
                // private_bucket_hash = format!("bucket_hash{}", i);
                private_bucket_prefix = format!("_fake");
                private_bucket_extension = format!("rvcV2");
                cached_user_ratings_total_count = i;
                cached_user_ratings_positive_count = i;
                cached_user_ratings_negative_count = i;
                cached_user_ratings_ratio = i as u32 / 100;
                version = i as i32;

                println!("Out of range");
            }
        }
     
            let args = CreateModelWeightsArgs {
                token: &model_weight_token, // replace with actual ModelWeightToken
                weights_type: weights_types, // replace with actual WeightsType
                weights_category, // replace with actual WeightsCategory
                title,
                maybe_thumbnail_token: Some(thumbnail_token.to_string()),
                description_markdown: description,
                description_rendered_html: description_rendered_html.to_string(),
                creator_user_token: Some(&user_token), // replace with actual UserToken
                creator_ip_address: "192.168.1.1",
                creator_set_visibility: Visibility::Public,
                maybe_last_update_user_token: Some(user_token.to_string()),
                original_download_url: Some(original_download_url),
                original_filename: Some(original_filename),
                file_size_bytes: 1024,
                file_checksum_sha2: "checksum1".to_string(),
                public_bucket_hash: "bucket_hash1".to_string(),
                maybe_public_bucket_prefix: Some(private_bucket_prefix),
                maybe_public_bucket_extension: Some(private_bucket_extension),
                cached_user_ratings_total_count,
                cached_user_ratings_positive_count,
                cached_user_ratings_negative_count,
                maybe_cached_user_ratings_ratio: Some(cached_user_ratings_ratio as f32),
                version,
                mysql_pool: &mysql_pool, // replace with actual MySqlPool
            };
        
            create_weight(args).await;
        }
    Ok(())
}
pub async fn seed_weights_for_user_token(
    mysql_pool: &Pool<MySql>,
    user_token: UserToken
) -> AnyhowResult<()> {
    info!("Seeding weights...");

    ModelWeightToken::reset_rng_for_testing_and_dev_seeding_never_use_in_production_seriously(54321);

    let model_weight_token1 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let model_weight_token2 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let model_weight_token3 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let model_weight_token4 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let model_weight_token5 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

    let model_weights_args = vec![
        CreateModelWeightsArgs {
            token: &model_weight_token1, // replace with actual ModelWeightToken
            weights_type: WeightsType::RvcV2, // replace with actual WeightsType
            weights_category: WeightsCategory::VoiceConversion, // replace with actual WeightsCategory
            title: "Title 1".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 1".to_string()),
            description_markdown: "Description 1".to_string(),
            description_rendered_html: "<p>Description 1</p>".to_string(),
            creator_user_token: Some(&user_token), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 1".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum1".to_string(),
            public_bucket_hash: "bucket_hash1".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("rvc".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token2, // replace with actual ModelWeightToken
            weights_type: WeightsType::HifiganTacotron2, // replace with actual WeightsType
            weights_category: WeightsCategory::TextToSpeech, // replace with actual WeightsCategory
            title: "Title 2".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 2".to_string()),
            description_markdown: "Description 2".to_string(),
            description_rendered_html: "<p>Description 2</p>".to_string(),
            creator_user_token: Some(&user_token), // replace with actual UserToken
            creator_ip_address: "292.268.2.2",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 2".to_string()),
            original_download_url: Some("http://example.com/download2".to_string()),
            original_filename: Some("filename2.txt".to_string()),
            file_size_bytes: 2024,
            file_checksum_sha2: "checksum2".to_string(),
            public_bucket_hash: "bucket_hash2".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("tt2".to_string()),
            cached_user_ratings_total_count: 20,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 2,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 2,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token3, // replace with actual ModelWeightToken
            weights_type: WeightsType::StableDiffusion15, // replace with actual WeightsType
            weights_category: WeightsCategory::ImageGeneration, // replace with actual WeightsCategory
            title: "Title 3".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 3".to_string()),
            description_markdown: "Description 3".to_string(),
            description_rendered_html: "<p>Description 3</p>".to_string(),
            creator_user_token: Some(&user_token), // replace with actual UserToken
            creator_ip_address: "392.368.3.3",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 3".to_string()),
            original_download_url: Some("http://example.com/download3".to_string()),
            original_filename: Some("filename3.txt".to_string()),
            file_size_bytes: 3024,
            file_checksum_sha2: "checksum3".to_string(),
            public_bucket_hash: "bucket_hash3".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("safetensors".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token4, // replace with actual ModelWeightToken
            weights_type: WeightsType::LoRA, // replace with actual WeightsType
            weights_category: WeightsCategory::ImageGeneration, // replace with actual WeightsCategory
            title: "Title 4".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 4".to_string()),
            description_markdown: "Description 4".to_string(),
            description_rendered_html: "<p>Description 4</p>".to_string(),
            creator_user_token: Some(&user_token), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 4".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum4".to_string(),
            public_bucket_hash: "bucket_hash4".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("LoRA".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 2,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token5, // replace with actual ModelWeightToken
            weights_type: WeightsType::LoRA, // replace with actual WeightsType
            weights_category: WeightsCategory::ImageGeneration, // replace with actual WeightsCategory
            title: "Title 5".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 4".to_string()),
            description_markdown: "Description 4".to_string(),
            description_rendered_html: "<p>Description 4</p>".to_string(),
            creator_user_token: Some(&user_token), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 4".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum4".to_string(),
            public_bucket_hash: "bucket_hash4".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("LoRA".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 2,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        }
    ];

    for model_weights_arg in model_weights_args {
        create_weight(model_weights_arg).await?;
    }
    Ok(())
}


pub async fn original_seed_weights(mysql_pool: &Pool<MySql>,user_token: UserToken) -> AnyhowResult<()> {
    let model_weight_token1 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let creator_token1 = UserToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

    let model_weight_token2 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let creator_token2 = UserToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

    let model_weight_token3 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let creator_token3 = UserToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

    let model_weight_token4 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let creator_token4 = UserToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

    let model_weight_token5 = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();
    let creator_token5 = UserToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

    let model_weights_args = vec![
        CreateModelWeightsArgs {
            token: &model_weight_token1, // replace with actual ModelWeightToken
            weights_type: WeightsType::RvcV2, // replace with actual WeightsType
            weights_category: WeightsCategory::VoiceConversion, // replace with actual WeightsCategory
            title: "Title 1".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 1".to_string()),
            description_markdown: "Description 1".to_string(),
            description_rendered_html: "<p>Description 1</p>".to_string(),
            creator_user_token: Some(&creator_token1), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 1".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum1".to_string(),
            public_bucket_hash: "bucket_hash1".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("rvc".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token2, // replace with actual ModelWeightToken
            weights_type: WeightsType::HifiganTacotron2, // replace with actual WeightsType
            weights_category: WeightsCategory::TextToSpeech, // replace with actual WeightsCategory
            title: "Title 2".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 2".to_string()),
            description_markdown: "Description 2".to_string(),
            description_rendered_html: "<p>Description 2</p>".to_string(),
            creator_user_token: Some(&creator_token2), // replace with actual UserToken
            creator_ip_address: "292.268.2.2",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 2".to_string()),
            original_download_url: Some("http://example.com/download2".to_string()),
            original_filename: Some("filename2.txt".to_string()),
            file_size_bytes: 2024,
            file_checksum_sha2: "checksum2".to_string(),
            public_bucket_hash: "bucket_hash2".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("tt2".to_string()),
            cached_user_ratings_total_count: 20,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 2,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 2,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token3, // replace with actual ModelWeightToken
            weights_type: WeightsType::StableDiffusion15, // replace with actual WeightsType
            weights_category: WeightsCategory::ImageGeneration, // replace with actual WeightsCategory
            title: "Title 3".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 3".to_string()),
            description_markdown: "Description 3".to_string(),
            description_rendered_html: "<p>Description 3</p>".to_string(),
            creator_user_token: Some(&creator_token3), // replace with actual UserToken
            creator_ip_address: "392.368.3.3",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 3".to_string()),
            original_download_url: Some("http://example.com/download3".to_string()),
            original_filename: Some("filename3.txt".to_string()),
            file_size_bytes: 3024,
            file_checksum_sha2: "checksum3".to_string(),
            public_bucket_hash: "bucket_hash3".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("safetensors".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token4, // replace with actual ModelWeightToken
            weights_type: WeightsType::LoRA, // replace with actual WeightsType
            weights_category: WeightsCategory::ImageGeneration, // replace with actual WeightsCategory
            title: "Title 4".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 4".to_string()),
            description_markdown: "Description 4".to_string(),
            description_rendered_html: "<p>Description 4</p>".to_string(),
            creator_user_token: Some(&creator_token4), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 4".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum4".to_string(),
            public_bucket_hash: "bucket_hash4".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("LoRA".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 2,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        },
        CreateModelWeightsArgs {
            token: &model_weight_token5, // replace with actual ModelWeightToken
            weights_type: WeightsType::LoRA, // replace with actual WeightsType
            weights_category: WeightsCategory::ImageGeneration, // replace with actual WeightsCategory
            title: "Title 5".to_string(),
            maybe_thumbnail_token: Some("Thumbnail 5".to_string()),
            description_markdown: "Description 5".to_string(),
            description_rendered_html: "<p>Description 5</p>".to_string(),
            creator_user_token: Some(&creator_token5), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 5".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1025,
            file_checksum_sha2: "checksum5".to_string(),
            public_bucket_hash: "bucket_hash5".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("LoRA".to_string()),
            cached_user_ratings_total_count: 10,
            cached_user_ratings_positive_count: 9,
            cached_user_ratings_negative_count: 1,
            maybe_cached_user_ratings_ratio: Some(0.9),
            version: 2,
            mysql_pool: &mysql_pool, // replace with actual MySqlPool
        }
    ];

    for model_weights_arg in model_weights_args {
        create_weight(model_weights_arg).await?;
    }

    Ok(())

}
pub async fn seed_weights(mysql_pool: &Pool<MySql>) -> AnyhowResult<()> {
    info!("Seeding weights...");
    
    let user_token = match get_user_token_by_username(HANASHI_USERNAME, mysql_pool).await? {
        None => {
            return Err(anyhow!("could not find user hanashi"));
        }
        Some(token) => token,
    };

    //original_seed_weights(mysql_pool,user_token).await?;
    //seed_weights_for_user_token(mysql_pool, user_token).await?;
    seed_weights_for_paging(mysql_pool,user_token).await?;

    Ok(())
}
