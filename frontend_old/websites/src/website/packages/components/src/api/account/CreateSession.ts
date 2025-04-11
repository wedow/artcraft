import MakeRequest from "../MakeRequest";

export interface CreateSessionRequest {
  username_or_email: string,
  password: string,
}

export interface CreateSessionResponse {
  success: boolean,
  error_type?: string,
  error_message?: string,
}

export const CreateSession = MakeRequest<string, CreateSessionRequest, CreateSessionResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/login",
});
