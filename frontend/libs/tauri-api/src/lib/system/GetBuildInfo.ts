import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface GetBuildInfoSuccess extends CommandResult {
  payload: GetBuildInfoPayload;
}

export interface GetBuildInfoPayload {
  build_timestamp: string;
  git_commit_id?: string | null;
  git_commit_short_id?: string | null;
  git_commit_timestamp?: string | null;
}

// Returns the Success and Error variants directly.
// Throws on Network/Tauri errors.
export const GetBuildInfo = async () : Promise<GetBuildInfoSuccess> => {
  try {
    return await invoke("get_build_info_command") as GetBuildInfoSuccess;
  } catch (error) {
    // NB: Endpoint should be infalliable
    throw error;
  }
}
