import { ApiConfig } from "@storyteller/components";

export interface W2lInferenceStats {
  success: boolean,
  pending_count: number,
  seconds_since_first: number,
}

export enum W2lInferenceStatsError {
  NotAuthorized,
  ServerError,
  FrontendError,
}

export type GetW2lInferenceStatsResponse = W2lInferenceStats | W2lInferenceStatsError;

export function GetW2lInferenceStatsIsOk(response: GetW2lInferenceStatsResponse): response is W2lInferenceStats {
  return response.hasOwnProperty('pending_count');
}

export function GetW2lInferenceStatsIsErr(response: GetW2lInferenceStatsResponse): response is W2lInferenceStatsError {
  return !response.hasOwnProperty('pending_count');
}

interface W2lInferenceStatsResponsePayload {
  success: boolean,
  error_reason?: string,
  pending_count?: number,
  seconds_since_first?: number,
}


export async function GetW2lInferenceStats() : Promise<GetW2lInferenceStatsResponse> 
{
  const endpoint = new ApiConfig().getW2lInferenceStats();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : W2lInferenceStatsResponsePayload = res;

    if (response?.success) {
      return res as W2lInferenceStats; // TODO: This is not the way.
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("authorized")) {
        return W2lInferenceStatsError.NotAuthorized;
      } else {
        return W2lInferenceStatsError.ServerError;
      }
    }

    return W2lInferenceStatsError.FrontendError;
  })
  .catch(e => {
    return W2lInferenceStatsError.FrontendError;
  });
}

