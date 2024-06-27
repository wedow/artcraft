use anyhow::anyhow;
use log::{error, info};

use filesys::check_file_exists::check_file_exists;
use mysql_queries::payloads::generic_inference_args::workflow_payload::WorkflowArgs;
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::video_paths::VideoPaths;
use crate::util::common_commands::ffmpeg_audio_replace_args::FfmpegAudioReplaceArgs;
use crate::util::common_commands::ffmpeg_extract_audio_args::FfmpegExtractAudioArgs;

pub struct ProcessSaveAudioArgs<'a> {
    pub comfy_deps: &'a ComfyDependencies,
    pub videos: &'a mut VideoPaths,
}

pub fn preprocess_save_audio(
    args: ProcessSaveAudioArgs<'_>
) -> Result<(), ProcessSingleJobError> {
    info!("Extracting audio...");


    let command_exit_status = args
        .comfy_deps
        .ffmpeg_command_runner
        .run_with_subprocess(RunAsSubprocessArgs {
            args: Box::new(&FfmpegExtractAudioArgs {
                input_video_file: &args.videos.trimmed_resampled_video_path,
                output_file: &args.videos.trimmed_audio_path
            }),
            stderr: StreamRedirection::None,
            stdout: StreamRedirection::None,
        });

    if !command_exit_status.is_success() {
        error!("Audio extraction failed: {:?}", command_exit_status);
        return Err(ProcessSingleJobError::Other(anyhow!("Command failed: {:?}", command_exit_status)));
    }
    Ok(())
}
