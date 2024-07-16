use std::path::{Path, PathBuf};
use log::{error, info};

use filesys::check_file_exists::check_file_exists;
use mysql_queries::payloads::generic_inference_args::workflow_payload::WorkflowArgs;
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::VideoPathing;
use crate::util::common_commands::ffmpeg_audio_replace_args::FfmpegAudioReplaceArgs;

pub struct PostProcessRestoreVideoArgs<'a> {
  pub comfy_deps: &'a ComfyDependencies,
  pub input_video_file: &'a Path,
  pub input_audio_file: &'a Path,
  pub output_video_file: &'a Path,
}

pub struct PostProcessRestoreVideoResult {
  pub audio_restored_video_path: Option<PathBuf>,
}
 /// NB: Purposefully infallible.
pub fn post_process_restore_audio(
  args: PostProcessRestoreVideoArgs<'_>
) -> (PostProcessRestoreVideoResult) {
  info!("Restoring audio...");


  let command_exit_status = args
      .comfy_deps
      .ffmpeg_command_runner
      .run_with_subprocess(RunAsSubprocessArgs {
        args: Box::new(&FfmpegAudioReplaceArgs {
          input_video_file: &args.input_video_file,
          input_audio_file: &args.input_audio_file,
          output_video_file: &args.output_video_file,
        }),
        stderr: StreamRedirection::None,
        stdout: StreamRedirection::None,
      });

  let mut use_restored_audio = true;

  // NB: Don't fail the entire command if audio restoration fails
  if let Err(err) = check_file_exists(&args.output_video_file.to_path_buf()) {
    use_restored_audio = false;
    error!("Audio copy failed: {:?}", err);
  }

  if !command_exit_status.is_success() {
    use_restored_audio = false;
    error!("Audio copy failed: {:?} ; we'll save the non-audio copy.", command_exit_status);
  }

  PostProcessRestoreVideoResult {
     audio_restored_video_path: if use_restored_audio {
       info!("Success generating restored audio file: {:?}", &args.output_video_file);
       Some(args.output_video_file.to_path_buf())
     } else {
       None
     }
   }
}
