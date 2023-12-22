use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use errors::AnyhowResult;

use crate::job::job_types::lipsync::sad_talker::sad_talker_dependencies::SadTalkerDependencies;
use crate::job::job_types::tts::tacotron2_v2_early_fakeyou::tacotron2_dependencies::Tacotron2Dependencies;
use crate::job::job_types::tts::vall_e_x::vall_e_x_dependencies::VallExDependencies;
use crate::job::job_types::tts::vits::vits_dependencies::VitsDependencies;
use crate::job::job_types::vc::rvc_v2::rvc_v2_dependencies::RvcV2Dependencies;
use crate::job::job_types::vc::so_vits_svc::svc_dependencies::SvcDependencies;
use crate::job::job_types::videofilter::rerender_a_video::rerender_dependencies::RerenderDependencies;
use crate::util::scoped_execution::ScopedExecution;

pub struct JobSpecificDependencies {
  pub maybe_rvc_v2_dependencies: Option<RvcV2Dependencies>,
  pub maybe_sad_talker_dependencies: Option<SadTalkerDependencies>,
  pub maybe_svc_dependencies: Option<SvcDependencies>,
  pub maybe_tacotron2_dependencies: Option<Tacotron2Dependencies>,
  pub maybe_vall_e_x_dependencies: Option<VallExDependencies>,
  pub maybe_vits_dependencies: Option<VitsDependencies>,
  pub maybe_rerender_dependencies: Option<RerenderDependencies>,
}

impl JobSpecificDependencies {

  pub fn setup_for_jobs(scoped_execution: &ScopedExecution) -> AnyhowResult<Self> {
    let mut maybe_rvc_v2_dependencies = None;
    let mut maybe_sad_talker_dependencies = None;
    let mut maybe_svc_dependencies = None;
    let mut maybe_tacotron2_dependencies = None;
    let mut maybe_vall_e_x_dependencies = None;
    let mut maybe_vits_dependencies = None;
    let mut maybe_rerender_dependencies = None;

    if scoped_execution.can_run_job(InferenceModelType::RvcV2) {
      print_with_space("Setting RVCv2 dependencies...");
      maybe_rvc_v2_dependencies = Some(RvcV2Dependencies::setup()?);
    }

    if scoped_execution.can_run_job(InferenceModelType::SadTalker) {
      print_with_space("Setting SadTalker dependencies...");
      maybe_sad_talker_dependencies = Some(SadTalkerDependencies::setup()?);
    }

    if scoped_execution.can_run_job(InferenceModelType::SoVitsSvc) {
      print_with_space("Setting SVC dependencies...");
      maybe_svc_dependencies = Some(SvcDependencies::setup()?);
    }

    if scoped_execution.can_run_job(InferenceModelType::Tacotron2) {
      print_with_space("Setting Tacotron2 dependencies...");
      maybe_tacotron2_dependencies = Some(Tacotron2Dependencies::setup()?);
    }

    if scoped_execution.can_run_job(InferenceModelType::VallEX) {
      print_with_space("Setting VALL-E-X dependencies...");
      maybe_vall_e_x_dependencies = Some(VallExDependencies::setup()?);
    }

    if scoped_execution.can_run_job(InferenceModelType::Vits) {
      print_with_space("Setting Vits dependencies...");
      maybe_vits_dependencies = Some(VitsDependencies::setup()?);
    }

    if scoped_execution.can_run_job(InferenceModelType::RerenderAVideo) {
      print_with_space("Setting Rerender dependencies...");
      maybe_rerender_dependencies = Some(RerenderDependencies::setup()?);
    }

    Ok(JobSpecificDependencies {
      maybe_rvc_v2_dependencies,
      maybe_sad_talker_dependencies,
      maybe_svc_dependencies,
      maybe_tacotron2_dependencies,
      maybe_vall_e_x_dependencies,
      maybe_vits_dependencies,
      maybe_rerender_dependencies,
    })
  }
}

fn print_with_space(line: &str) {
  println!("\n  ---------- \n  {line} \n  ---------- \n");
}
