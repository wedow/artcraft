import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../../common/CommandStatus";

export interface MediaFileDeleteSuccess extends CommandResult {
  payload: MediaFileDeletePayload;
}

export interface MediaFileDeletePayload {
}

export const MediaFileDelete = async (media_file_token: string) : Promise<MediaFileDeleteSuccess> => {
  try {
    return await invoke("media_file_delete_command", {
      request: {
        media_file_token: media_file_token
      }
    }) as MediaFileDeleteSuccess;
  } catch (error) {
    throw error;
  }
}
