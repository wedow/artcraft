use std::collections::HashSet;
use std::env;
use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use log::info;
use once_cell::sync::Lazy;
use subprocess::{Popen, PopenConfig};

use container_common::anyhow_result::AnyhowResult;
use filesys::path_to_string::path_to_string;
use subprocess_common::docker_options::{DockerFilesystemMount, DockerGpu, DockerOptions};

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
pub struct RvcV2InferenceCommand {
  /// Where the rvc (v2) code lives
  rvc_v2_root_code_directory: PathBuf,

  /// A single executable script or a much larger bash command.
  executable_or_command: ExecutableOrCommand,

  /// eg. `source python/bin/activate`
  maybe_virtual_env_activation_command: Option<String>,

  /// Optional default config file to use
  maybe_default_config_path: Option<PathBuf>,

  /// If this is run under Docker (eg. in development), these are the options.
  maybe_docker_options: Option<DockerOptions>,

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

pub struct InferenceArgs<P: AsRef<Path>, Q: AsRef<Path>> {
  /// --model_path: model path
  pub model_path: P,

  /// --model_index_path: model index path
  pub maybe_model_index_path: Option<Q>,

  /// --hubert_model_path: path to the hubert model on the filesystem
  pub hubert_path: P,

  /// --input_audio_filename: input wav path
  pub input_path: P,

  /// --output_audio_filename: output path of wav file.
  pub output_path: P,
}

impl RvcV2InferenceCommand {
  pub fn new<P: AsRef<Path>>(
    rvc_v2_root_code_directory: P,
    executable_or_command: ExecutableOrCommand,
    maybe_virtual_env_activation_command: Option<&str>,
    maybe_default_config_path: Option<P>,
    maybe_docker_options: Option<DockerOptions>,
    maybe_execution_timeout: Option<Duration>,
  ) -> Self {
    Self {
      rvc_v2_root_code_directory: rvc_v2_root_code_directory.as_ref().to_path_buf(),
      executable_or_command,
      maybe_virtual_env_activation_command: maybe_virtual_env_activation_command.map(|s| s.to_string()),
      maybe_default_config_path: maybe_default_config_path.map(|p| p.as_ref().to_path_buf()),
      maybe_docker_options,
      maybe_execution_timeout,
    }
  }

  pub fn from_env() -> AnyhowResult<Self> {
    let so_vits_svc_root_code_directory = easyenv::get_env_pathbuf_required(
      "RVC_V2_INFERENCE_ROOT_DIRECTORY")?;

    // NB: The command is installed (typically as `svc`) rather than called as a python script.
    // Lately we've had to call it as `python3 -m so_vits_svc_fork.fakeyou_infer`
    let maybe_inference_command = easyenv::get_env_string_optional(
      "RVC_V2_INFERENCE_COMMAND");

    // Optional, eg. `./infer.py`. Typically we'll use the command form instead.
    let maybe_inference_executable = easyenv::get_env_pathbuf_optional(
      "RVC_V2_INFERENCE_EXECUTABLE");

    let executable_or_command = match maybe_inference_command {
      Some(command) => ExecutableOrCommand::Command(command),
      None => match maybe_inference_executable {
        Some(executable) => ExecutableOrCommand::Executable(executable),
        None => return Err(anyhow!("neither command nor executable passed")),
      },
    };

    let maybe_virtual_env_activation_command = easyenv::get_env_string_optional(
      "RVC_V2_INFERENCE_MAYBE_VENV_COMMAND");

    let maybe_default_config_path = easyenv::get_env_pathbuf_optional(
      "RVC_V2_INFERENCE_MAYBE_DEFAULT_CONFIG_PATH");

    let maybe_execution_timeout =
        easyenv::get_env_duration_seconds_optional("RVC_V2_TIMEOUT_SECONDS");

    let maybe_docker_options = easyenv::get_env_string_optional(
      "RVC_V2_INFERENCE_MAYBE_DOCKER_IMAGE")
        .map(|image_name| {
          DockerOptions {
            image_name,
            maybe_bind_mount: Some(DockerFilesystemMount::tmp_to_tmp()),
            maybe_environment_variables: None,
            maybe_gpu: Some(DockerGpu::All),
          }
        });

    Ok(Self {
      rvc_v2_root_code_directory: so_vits_svc_root_code_directory,
      executable_or_command,
      maybe_virtual_env_activation_command,
      maybe_default_config_path,
      maybe_docker_options,
      maybe_execution_timeout,
    })
  }

  pub fn execute_inference<P: AsRef<Path>, Q: AsRef<Path>>(
    &self,
    args: InferenceArgs<P, Q>,
  ) -> CommandExitStatus {
    match self.do_execute_inference(args) {
      Ok(exit_status) => exit_status,
      Err(error) => CommandExitStatus::FailureWithReason { reason: format!("error: {:?}", error) },
    }
  }

  fn do_execute_inference<P: AsRef<Path>, Q: AsRef<Path>>(
    &self,
    args: InferenceArgs<P, Q>,
  ) -> AnyhowResult<CommandExitStatus> {

    let mut command = String::new();
    command.push_str(&format!("cd {}", path_to_string(&self.rvc_v2_root_code_directory)));

    if let Some(venv_command) = self.maybe_virtual_env_activation_command.as_deref() {
      command.push_str(" && ");
      command.push_str(venv_command);
      command.push(' ');
    }

    // NB: We can't use `onnx` for model integrity checking (that might take long anyway), so
    // we'll just run inference instead. That's flexible and works.
    command.push_str(" && ");

    match self.executable_or_command {
      ExecutableOrCommand::Executable(ref executable) => {
        command.push_str(&path_to_string(executable));
        command.push_str(" infer ");
      }
      ExecutableOrCommand::Command(ref cmd) => {
        command.push_str(cmd);
        command.push(' ');
      }
    }

    // ===== Begin Python Args =====

    command.push_str(" --model_path ");
    command.push_str(&path_to_string(args.model_path));

    if let Some(model_index_path) = args.maybe_model_index_path {
      command.push_str(" --model_index_path ");
      command.push_str(&path_to_string(model_index_path));
    }

    command.push_str(" --hubert_model_path ");
    command.push_str(&path_to_string(args.hubert_path));

    command.push_str(" --input_audio_filename ");
    command.push_str(&path_to_string(args.input_path));

    command.push_str(" --output_audio_filename ");
    command.push_str(&path_to_string(args.output_path));

    // ===== End Python Args =====

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Command: {:?}", command);

    let command_parts = [
      "bash",
      "-c",
      &command
    ];

    let mut env_vars = Vec::new();

    // Copy all environment variables from the parent process.
    // This is necessary to send all the kubernetes settings for Nvidia / CUDA.
    for (env_key, env_value) in env::vars() {
      if IGNORED_ENVIRONMENT_VARS.contains(&env_key) {
        continue;
      }
      env_vars.push((
        OsString::from(env_key),
        OsString::from(env_value),
      ));
    }

    let mut config = PopenConfig::default();

    if !env_vars.is_empty() {
      config.env = Some(env_vars);
    }

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
