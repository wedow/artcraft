import { ApiConfig } from "@storyteller/components";

export interface TtsInferenceStats {
  success: boolean,
  seconds_since_first: number,
  pending_count: number,
  pending_priority_nonzero_count: number,
  pending_priority_gt_one_count: number,
  attempt_failed_count: number,
}

export enum TtsInferenceStatsError {
  NotAuthorized,
  ServerError,
  FrontendError,
}

export type GetTtsInferenceStatsResponse = TtsInferenceStats | TtsInferenceStatsError;

export function GetTtsInferenceStatsIsOk(response: GetTtsInferenceStatsResponse): response is TtsInferenceStats {
  return response.hasOwnProperty('pending_count');
}

export function GetTtsInferenceStatsIsErr(response: GetTtsInferenceStatsResponse): response is TtsInferenceStatsError {
  return !response.hasOwnProperty('pending_count');
}

interface TtsInferenceStatsResponsePayload {
  success: boolean,
  error_reason?: string,
  pending_count?: number,
  seconds_since_first?: number,
}


export async function GetTtsInferenceStats() : Promise<GetTtsInferenceStatsResponse> 
{
  const endpoint = new ApiConfig().getTtsInferenceStats();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : TtsInferenceStatsResponsePayload = res;

    if (response?.success) {
      return res as TtsInferenceStats; // TODO: This is not the way.
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("authorized")) {
        return TtsInferenceStatsError.NotAuthorized;
      } else {
        return TtsInferenceStatsError.ServerError;
      }
    }

    return TtsInferenceStatsError.FrontendError;
  })
  .catch(e => {
    return TtsInferenceStatsError.FrontendError;
  });
}
