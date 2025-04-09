import { ApiConfig } from "../ApiConfig";

export interface GetPendingTtsJobCountSuccessResponse {
  success: boolean,
  pending_job_count: number,
  cache_time: Date,
  refresh_interval_millis: number,
}

export interface GetPendingTtsJobCountErrorResponse {
}

export type GetPendingTtsJobCountResponse = GetPendingTtsJobCountSuccessResponse | GetPendingTtsJobCountErrorResponse;

export function GetPendingTtsJobCountIsOk(response: GetPendingTtsJobCountResponse): response is GetPendingTtsJobCountSuccessResponse {
  return response.hasOwnProperty('pending_job_count');
}

export function GetPendingTtsJobCountIsErr(response: GetPendingTtsJobCountResponse): response is GetPendingTtsJobCountErrorResponse {
  return !response.hasOwnProperty('pending_job_count');
}

export async function GetPendingTtsJobCount() : Promise<GetPendingTtsJobCountResponse> {
  const endpoint = new ApiConfig().getPendingTtsJobCount();

  return fetch(endpoint, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  })
  .then(res => res.json())
  .then(res => {
    if (res && 'success' in res && res['success']) {
      // NB: Timestamps aren't converted to Date objects on their own!
      res['cache_time'] = new Date(res['cache_time']);
      return res;
    } else {
      return { success : false };
    }
  })
  .catch(e => {
    return { success : false };
  });
}
