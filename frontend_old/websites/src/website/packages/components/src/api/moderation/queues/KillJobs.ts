
import { ApiConfig } from "@storyteller/components";

export interface KillJobsRequest {
  job_statuses: string[],
}

export interface KillJobsSuccessResponse {
  success: boolean,
}

export interface KillJobsErrorResponse {
  success: boolean,
}

type KillJobsResponse = KillJobsSuccessResponse | KillJobsErrorResponse;

export function KillJobsIsSuccess(response: KillJobsResponse): response is KillJobsSuccessResponse {
  return response?.success === true;
}

export function KillJobsIsError(response: KillJobsResponse): response is KillJobsErrorResponse {
  return response?.success === false;
}

export async function KillJobs(request: KillJobsRequest) : Promise<KillJobsResponse> 
{
  const endpoint = new ApiConfig().killJobs();

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
