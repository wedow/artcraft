import MakeRequest from "../MakeRequest";

export interface CreateSessionRequest {
  username_or_email: string;
  password: string;
}

export interface CreateSessionSuccessResponse {
  success: boolean;
}

export interface CreateSessionErrorResponse {
  success: boolean;
  error_type: string;
  error_message: string;
}

export type CreateSessionResponse = CreateSessionSuccessResponse | CreateSessionErrorResponse;

export function CreateSessionIsSuccess(response: CreateSessionResponse): response is CreateSessionSuccessResponse {
  return response?.success === true;
}

export function CreateSessionIsError(response: CreateSessionResponse): response is CreateSessionErrorResponse {
  return response?.success === false;
}

export const CreateSession = MakeRequest<string, CreateSessionRequest, CreateSessionResponse, {}>({
  method: "POST",
  routingFunction: () => "/v1/login",
});
