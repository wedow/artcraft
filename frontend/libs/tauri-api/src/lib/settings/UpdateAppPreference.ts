
import { invoke } from "@tauri-apps/api/core";

export interface UpdateAppPreferencesRequest {
  preference: PreferenceName,
  value: string,
}

export enum PreferenceName {
  PreferredDownloadDirectory = "preferred_download_directory",
  PlaySounds = "play_sounds", 
}

export interface UpdateAppPreferencesResult {
  success: boolean
}

export const UpdateAppPreferences = async (request: UpdateAppPreferencesRequest) : Promise<UpdateAppPreferencesResult> => {
  let result = await invoke("update_app_preferences_command", { 
    request: {
      preference: request.preference,
      value: request.value,
    }
  });
  return (result as UpdateAppPreferencesResult);
}
