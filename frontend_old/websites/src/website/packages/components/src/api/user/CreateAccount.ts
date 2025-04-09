import MakeRequest from "../MakeRequest";

export interface CreateAccountRequest {
  username: string;
  email_address: string;
  password: string;
  password_confirmation: string;
}

export interface CreateAccountSuccessResponse {
  success: boolean;
}

export interface CreateAccountErrorResponse {
  success: boolean;
  error_type: string;
  error_fields: { [key: string]: string };
}

export type CreateAccountResponse =
  | CreateAccountSuccessResponse
  | CreateAccountErrorResponse;

export function CreateAccountIsSuccess(
  response: CreateAccountResponse
): response is CreateAccountSuccessResponse {
  return response?.success === true;
}

export function CreateAccountIsError(
  response: CreateAccountResponse
): response is CreateAccountErrorResponse {
  return response?.success === false;
}

export const CreateAccount = MakeRequest<
  string,
  CreateAccountRequest,
  CreateAccountResponse,
  {}
>({
  method: "POST",
  routingFunction: () => "/v1/create_account",
});
