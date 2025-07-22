use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::state::task_database::TaskDatabase;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use sqlite_tasks::error::SqliteTasksError;
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use tokens::tokens::sqlite::tasks::TaskId;

pub struct TaskEnqueueSuccess {
  pub task_type: TaskType,
  pub model: Option<GenerationModel>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
  // TODO: We may want to change the `model` type - this has weird ownership and semantics
}

impl TaskEnqueueSuccess{
  pub fn to_frontend_event_action(&self) -> GenerationAction {
    match self.task_type {
      TaskType::ImageGeneration => GenerationAction::GenerateImage,
      TaskType::VideoGeneration => GenerationAction::GenerateVideo,
      TaskType::BackgroundRemoval => GenerationAction::RemoveBackground,
      TaskType::ObjectGeneration => GenerationAction::ImageTo3d,
    }
  }
  
  pub fn to_frontend_event_service(&self) -> GenerationServiceProvider {
    match self.provider {
      GenerationProvider::Artcraft => GenerationServiceProvider::Artcraft,
      GenerationProvider::Fal => GenerationServiceProvider::Fal,
      GenerationProvider::Sora => GenerationServiceProvider::Sora,
    }
  }
  
  pub async fn insert_into_task_database(&self, task_database: &TaskDatabase) -> Result<TaskId, SqliteTasksError> {
    // TODO: Move this mapping elsewhere, or remove the other models.
    let model_type = match self.model {
      None => None,
      Some(GenerationModel::Flux1Dev) => Some(TaskModelType::Flux1Dev),
      Some(GenerationModel::Flux1Schnell) => Some(TaskModelType::Flux1Schnell),
      Some(GenerationModel::FluxPro11) => Some(TaskModelType::FluxPro11),
      Some(GenerationModel::FluxPro11Ultra) => Some(TaskModelType::FluxPro11Ultra),
      Some(GenerationModel::GptImage1) => Some(TaskModelType::GptImage1),
      Some(GenerationModel::Recraft3) => Some(TaskModelType::Recraft3),
      Some(GenerationModel::Kling21Pro) => Some(TaskModelType::Kling21Pro),
      Some(GenerationModel::Kling21Master) => Some(TaskModelType::Kling21Master),
      Some(GenerationModel::Seedance10Lite) => Some(TaskModelType::Seedance10Lite),
      Some(GenerationModel::Veo2) => Some(TaskModelType::Veo2),
      Some(GenerationModel::Hunyuan3d2_0) => Some(TaskModelType::Hunyuan3d2_0),
      Some(GenerationModel::Hunyuan3d2_1) => Some(TaskModelType::Hunyuan3d2_1),

      // TODO: These seem wrong -
      Some(GenerationModel::Kling1_6) => Some(TaskModelType::Kling16Pro), // NB: `VideoModel::Kling16Pro`.
      Some(GenerationModel::Kling2_0) => None, // TODO: unused elsewhere?
      Some(GenerationModel::Sora) => None, // TODO: unused elsewhere?
    };

    create_task(CreateTaskArgs {
      db: task_database.get_connection(),
      status: TaskStatus::Pending,
      task_type: self.task_type,
      model_type: model_type,
      provider: self.provider,
      provider_job_id: self.provider_job_id.as_deref(),
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }).await
  }
  
//  pub fn tauri_event_model(&self) -> GenerationModel {
//    match self.model {
//      ImageModel::Flux1Dev => GenerationModel::Flux1Dev,
//      ImageModel::Flux1Schnell => GenerationModel::Flux1Schnell,
//      ImageModel::FluxPro11 => GenerationModel::FluxPro11,
//      ImageModel::FluxPro11Ultra => GenerationModel::FluxPro11Ultra,
//      ImageModel::GptImage1 => GenerationModel::GptImage1,
//      ImageModel::Recraft3 => GenerationModel::Recraft3,
//    }
//  }
  
}