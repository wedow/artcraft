import { ApiConfig } from "@storyteller/components";

export interface VoiceInventoryStats {
  success: boolean,
  public_voices_count: number,
  all_voices_count_including_deleted: number,
}

export enum VoiceInventoryStatsError {
  NotAuthorized,
  ServerError,
  FrontendError,
}

export type GetVoiceInventoryStatsResponse = VoiceInventoryStats | VoiceInventoryStatsError;

export function GetVoiceInventoryStatsIsOk(response: GetVoiceInventoryStatsResponse): response is VoiceInventoryStats {
  return response.hasOwnProperty('public_voices_count');
}

export function GetVoiceInventoryStatsIsErr(response: GetVoiceInventoryStatsResponse): response is VoiceInventoryStatsError {
  return !response.hasOwnProperty('public_voices_count');
}

interface VoiceInventoryStatsResponsePayload {
  success: boolean,
  error_reason?: string,
  pending_count?: number,
  seconds_since_first?: number,
}


export async function GetVoiceInventoryStats() : Promise<GetVoiceInventoryStatsResponse> 
{
  const endpoint = new ApiConfig().getTtsVoiceInventoryStats();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : VoiceInventoryStatsResponsePayload = res;

    if (response?.success) {
      return res as VoiceInventoryStats; // TODO: This is not the way.
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("authorized")) {
        return VoiceInventoryStatsError.NotAuthorized;
      } else {
        return VoiceInventoryStatsError.ServerError;
      }
    }

    return VoiceInventoryStatsError.FrontendError;
  })
  .catch(e => {
    return VoiceInventoryStatsError.FrontendError;
  });
}
