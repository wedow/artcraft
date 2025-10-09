import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../common/CommandStatus";
import { TaskStatus, TaskType, TaskModelType, GenerationProvider } from "@storyteller/api-enums";

interface GetTaskQueueResponse {
  tasks: TaskQueueItem[],
}

export interface TaskQueueItem {
  id: string,
  task_status: TaskStatus,
  task_type: TaskType,
  model_type?: TaskModelType,
  provider?: GenerationProvider,
  provider_job_id?: string,
  created_at: Date,
  updated_at: Date,
  completed_at?: Date,
}

interface GetTaskQueueSuccess extends CommandResult {
  payload: GetTaskQueueResponse;
}

export const GetTaskQueue = async () : Promise<GetTaskQueueResponse> => {
  try {
    let result = await invoke("get_task_queue_command") as GetTaskQueueSuccess;
    return result.payload;
  } catch (error) {
    throw error;
  }
}

(window as any).test_get_task_queue = GetTaskQueue;
