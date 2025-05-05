import { invoke } from "@tauri-apps/api/core";

export interface GetAppPreferencesResult {
  preferences: AppPreferencesPayload,
}

export interface AppPreferencesPayload {
  // Preferred download directory
  preferred_download_directory: string,

  // Play sounds on events.
  play_sounds: boolean,
}

export const GetAppPreferences = async () : Promise<GetAppPreferencesResult> => {
  let result = await invoke("get_app_preferences_command");
  return (result as GetAppPreferencesResult);
}
