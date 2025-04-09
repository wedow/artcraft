import { ApiConfig } from "@storyteller/components";

export interface RedeemResetPasswordRedeem {
  reset_token: string,
  new_password: string,
  new_password_validation: string,
}

export interface RedeemResetPasswordSuccessResponse {
  success: boolean,
}

export interface RedeemResetPasswordErrorResponse {
  success: boolean,
  error_type: string,
  error_fields: { [key: string]: string; },
}

type RedeemResetPasswordResponse = RedeemResetPasswordSuccessResponse | RedeemResetPasswordErrorResponse;

export function RedeemResetPasswordIsSuccess(response: RedeemResetPasswordResponse): response is RedeemResetPasswordSuccessResponse {
  return response?.success === true;
}

export function RedeemResetPasswordIsError(response: RedeemResetPasswordResponse): response is RedeemResetPasswordErrorResponse {
  return response?.success === false;
}

export async function RedeemResetPassword(Redeem: RedeemResetPasswordRedeem) : Promise<RedeemResetPasswordResponse> 
{
  const endpoint = new ApiConfig().passwordResetRedeem();
  
  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(Redeem),
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
