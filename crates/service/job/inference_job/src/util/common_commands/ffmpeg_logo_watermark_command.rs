use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::{info, warn};
use once_cell::sync::Lazy;
use subprocess::{Popen, PopenConfig};

use container_common::anyhow_result::AnyhowResult;
use filesys::path_to_string::path_to_string;

use crate::job::job_loop::command_exit_status::CommandExitStatus;

// These environment vars are not copied over to the subprocess
// TODO/FIXME(bt, 2023-05-28): This is horrific security!
static IGNORED_ENVIRONMENT_VARS : Lazy<HashSet<String>> = Lazy::new(|| {
  let env_var_names= [
    "MYSQL_URL",
    "ACCESS_KEY",
    "SECRET_KEY",
    "NEWRELIC_API_KEY",
  ];

  env_var_names.iter()
      .map(|value| value.to_string())
      .collect::<HashSet<String>>()
});

#[derive(Clone)]
pub struct FfmpegLogoWatermarkCommand {
  /// A single executable script or a much larger bash command.
  executable_or_command: ExecutableOrCommand,

  /// Optional default location of the logo to watermark
  maybe_default_logo_path: Option<PathBuf>,

  /// If the execution should be ended after a certain point.
  maybe_execution_timeout: Option<Duration>,
}

#[derive(Clone)]
pub enum ExecutableOrCommand {
  /// Eg. `infer.py`
  Executable(PathBuf),

  /// Eg. `python3 -m so_vits_svc_fork.fakeyou_infer`
  Command(String),
}

pub struct InferenceArgs<P: AsRef<Path>> {
  /// -i: video path
  pub video_path: P,

  /// -i: watermark path (optional override)
  pub maybe_override_logo_path: Option<P>,

  /// transparency
  pub alpha: f32,

  /// --output_audio_filename: output path of wav file.
  pub output_path: P,
}

impl FfmpegLogoWatermarkCommand {
  pub fn new<P: AsRef<Path>>(
    executable_or_command: ExecutableOrCommand,
    maybe_default_logo_path: Option<P>,
    maybe_execution_timeout: Option<Duration>,
  ) -> Self {
    Self {
      executable_or_command,
      maybe_default_logo_path: maybe_default_logo_path.map(|p| p.as_ref().to_path_buf()),
      maybe_execution_timeout,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let maybe_command = easyenv::get_env_string_optional(
      "FFMPEG_LOGO_COMMAND");

    let maybe_executable = easyenv::get_env_pathbuf_optional(
      "FFMPEG_LOGO_EXECUTABLE");

    let executable_or_command = match maybe_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => match maybe_executable {
        Some(executable) => ExecutableOrCommand::Executable(executable),
        None => {
          warn!("Neither executable or command supplied, using `ffmpeg`.");
          ExecutableOrCommand::Command("ffmpeg".to_string())
        }
      },
    };

    let maybe_default_logo_path = easyenv::get_env_pathbuf_optional(
      "FFMPEG_LOGO_LOGO_PATH");

    let maybe_execution_timeout =
        easyenv::get_env_duration_seconds_optional("FFMPEG_LOGO_TIMEOUT_SECONDS");

    Ok(Self {
      executable_or_command,
      maybe_default_logo_path,
      maybe_execution_timeout,
    })
  }

  pub fn execute_inference<P: AsRef<Path>>(
    &self,
    args: InferenceArgs<P>,
  ) -> CommandExitStatus {
    match self.do_execute_inference(args) {
      Ok(exit_status) => exit_status,
      Err(error) => CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
    }
  }

  fn do_execute_inference<P: AsRef<Path>>(
    &self,
    args: InferenceArgs<P>,
  ) -> AnyhowResult<CommandExitStatus> {

    let mut command = String::new();

    match self.executable_or_command {
      ExecutableOrCommand::Executable(ref executable) => {
        command.push_str(&path_to_string(executable));
        command.push(' ');
      }
      ExecutableOrCommand::Command(ref cmd) => {
        command.push_str(cmd);
        command.push(' ');
      }
    }

    // ===== Begin Python Args =====

    command.push_str(" -y "); // Don't ask confirmation to replace if a file already exists.
    command.push_str(" -i ");
    command.push_str(&path_to_string(args.video_path));

    let watermark_path = args.maybe_override_logo_path.as_ref()
        .map(|p| p.as_ref().to_path_buf())
        .or(self.maybe_default_logo_path.clone())
        .ok_or(anyhow!("no watermark path"))?;

    command.push_str(" -i ");
    command.push_str(&path_to_string(watermark_path));

    // ffmpeg filter
    command.push_str(" -filter_complex ");
    command.push_str(&format!("\"[1]format=rgba,colorchannelmixer=aa={}[logo];", args.alpha));
    command.push_str("[logo][0]scale2ref=oh*mdar:ih*0.2[logo][video];");
    command.push_str("[video][logo]overlay=(main_w-overlay_w)-10:(main_h-overlay_h)-10\"");
    command.push(' ');

    command.push_str(&path_to_string(args.output_path));


    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let config = PopenConfig::default();

    let mut p = Popen::create(&command_parts, config)?;

    info!("Subprocess PID: {:?}", p.pid());

    match self.maybe_execution_timeout {
      None => {
        let exit_status = p.wait()?;
        info!("Subprocess exit status: {:?}", exit_status);
        Ok(CommandExitStatus::from_exit_status(exit_status))
      }
      Some(timeout) => {
        info!("Executing with timeout: {:?}", &timeout);
        let exit_status = p.wait_timeout(timeout)?;

        match exit_status {
          None => {
            // NB: If the program didn't successfully terminate, kill it.
            info!("Subprocess didn't end after timeout: {:?}; terminating...", &timeout);
            p.terminate()?;
            Ok(CommandExitStatus::Timeout)
          }
          Some(exit_status) => {
            info!("Subprocess timed wait exit status: {:?}", exit_status);
            Ok(CommandExitStatus::from_exit_status(exit_status))
          }
        }
      }
    }
  }
}
