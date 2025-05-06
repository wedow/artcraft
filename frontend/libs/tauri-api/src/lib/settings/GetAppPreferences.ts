import { invoke } from "@tauri-apps/api/core";

export interface GetAppPreferencesResult {
  preferences: AppPreferencesPayload,
}

export interface AppPreferencesPayload {
  // Preferred download directory
  preferred_download_directory: PreferredDownloadDirectory,

  // Play sounds on events.
  play_sounds: boolean,
}

export type PreferredDownloadDirectory = SystemDirectory | CustomDirectory;

export interface SystemDirectory {
  // If the directory is a system directory.
  system: string,
}

export interface CustomDirectory {
  // If the directory is a custom user directory.
  custom: string,
}

export const GetAppPreferences = async () : Promise<GetAppPreferencesResult> => {
  let result = await invoke("get_app_preferences_command");
  return (result as GetAppPreferencesResult);
}
