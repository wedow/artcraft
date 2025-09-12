import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface ArtcraftGetCreditsSuccess extends CommandResult {
  payload: ArtcraftGetCreditsPayload;
}

export interface ArtcraftGetCreditsPayload {
  free_credits: number,
  monthly_credits: number,
  banked_credits: number,
  sum_total_credits: number,
}

// Returns the Success and Error variants directly.
// Throws on Network/Tauri errors.
export const ArtcraftGetCredits = async () : Promise<ArtcraftGetCreditsSuccess> => {
  try {
    return await invoke("storyteller_get_credits_command") as ArtcraftGetCreditsSuccess;
  } catch (error) {
    // NB: Endpoint should be infalliable
    throw error;
  }
}
