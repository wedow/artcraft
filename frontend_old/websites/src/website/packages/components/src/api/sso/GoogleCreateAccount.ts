import { ApiConfig } from "@storyteller/components";

export interface GoogleCreateAccountRequest {
  //uuid_idempotency_token: string,
  google_credential: string;
}

export interface GoogleCreateAccountSuccessResponse {
  success: boolean;
  comment_token: string;
  username_not_yet_customized: boolean;
}

export interface GoogleCreateAccountErrorResponse {
  success: boolean;
  signed_session: string;
  automatic_user_display_name: string;
  username_not_yet_customized: boolean;
}

type GoogleCreateAccountResponse =
  | GoogleCreateAccountSuccessResponse
  | GoogleCreateAccountErrorResponse;

export function GoogleCreateAccountIsOk(
  response: GoogleCreateAccountResponse
): response is GoogleCreateAccountSuccessResponse {
  return response?.success === true;
}

export function GoogleCreateAccountIsError(
  response: GoogleCreateAccountResponse
): response is GoogleCreateAccountErrorResponse {
  return response?.success === false;
}

export async function GoogleCreateAccount(
  request: GoogleCreateAccountRequest
): Promise<GoogleCreateAccountResponse> {
  const endpoint = new ApiConfig().googleCreateAccount();

  return await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  })
    .then(res => res.json())
    .then(res => {
      if (!res) {
        return { success: false };
      }

      if (res && "success" in res) {
        return res;
      } else {
        return { success: false };
      }
    })
    .catch(e => {
      return { success: false };
    });
}
