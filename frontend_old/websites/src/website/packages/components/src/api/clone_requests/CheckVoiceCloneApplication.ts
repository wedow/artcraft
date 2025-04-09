
import { ApiConfig } from "@storyteller/components";

export interface CheckVoiceCloneApplicationRequest {
  maybe_request_token?: string,
}

export interface CheckVoiceCloneApplicationSuccessResponse {
  success: boolean,
  // If we've detected they've submited before
  has_submitted: boolean,
}

export interface CheckVoiceCloneApplicationErrorResponse {
  success: boolean,
}

type CheckVoiceCloneApplicationResponse = CheckVoiceCloneApplicationSuccessResponse | CheckVoiceCloneApplicationErrorResponse;

export function CheckVoiceCloneApplicationIsSuccess(response: CheckVoiceCloneApplicationResponse): response is CheckVoiceCloneApplicationSuccessResponse {
  return response?.success === true;
}

export function CheckVoiceCloneApplicationIsError(response: CheckVoiceCloneApplicationResponse): response is CheckVoiceCloneApplicationErrorResponse {
  return response?.success === false;
}

export async function CheckVoiceCloneApplication(request: CheckVoiceCloneApplicationRequest) : Promise<CheckVoiceCloneApplicationResponse> 
{
  const endpoint = new ApiConfig().checkVoiceCloneRequest();
  
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
