import { ApiConfig } from "@storyteller/components";

export interface RequestResetPasswordRequest {
  username_or_email: string,
}

export interface RequestResetPasswordSuccessResponse {
  success: boolean,
}

export interface RequestResetPasswordErrorResponse {
  success: boolean,
  error_type: string,
  error_fields: { [key: string]: string; },
}

type RequestResetPasswordResponse = RequestResetPasswordSuccessResponse | RequestResetPasswordErrorResponse;

export function RequestResetPasswordIsSuccess(response: RequestResetPasswordResponse): response is RequestResetPasswordSuccessResponse {
  return response?.success === true;
}

export function RequestResetPasswordIsError(response: RequestResetPasswordResponse): response is RequestResetPasswordErrorResponse {
  return response?.success === false;
}

export async function RequestResetPassword(request: RequestResetPasswordRequest) : Promise<RequestResetPasswordResponse> 
{
  const endpoint = new ApiConfig().passwordResetRequest();
  
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
