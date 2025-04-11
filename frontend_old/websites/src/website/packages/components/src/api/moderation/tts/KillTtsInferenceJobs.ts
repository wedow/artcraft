
import { ApiConfig } from "@storyteller/components";

export enum KillAction {
  AllPending = 'all_pending',
  AllPendingAndFailed = 'all_pending_and_failed',
  ZeroPriorityPending = 'zero_priority_pending',
}

export interface KillTtsInferenceJobsRequest {
  kill_action: KillAction,
}

export interface KillTtsInferenceJobsSuccessResponse {
  success: boolean,
}

export interface KillTtsInferenceJobsErrorResponse {
  success: boolean,
}

type KillTtsInferenceJobsResponse = KillTtsInferenceJobsSuccessResponse | KillTtsInferenceJobsErrorResponse;

export function KillTtsInferenceJobsIsSuccess(response: KillTtsInferenceJobsResponse): response is KillTtsInferenceJobsSuccessResponse {
  return response?.success === true;
}

export function KillTtsInferenceJobsIsError(response: KillTtsInferenceJobsResponse): response is KillTtsInferenceJobsErrorResponse {
  return response?.success === false;
}

export async function KillTtsInferenceJobs(killAction: KillAction) : Promise<KillTtsInferenceJobsResponse> 
{
  const endpoint = new ApiConfig().killTtsInferenceJobs();

  const request : KillTtsInferenceJobsRequest = {
    kill_action: killAction,
  };
  
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  })
  .then(res => res.json())
  .then(res => {
    if (!res) {
      return { success : false };
    }

    if (res && 'success' in res) {
      return res;
    } else {
      return { success : false };
    }
  })
  .catch(e => {
    return { success : false };
  });
}
