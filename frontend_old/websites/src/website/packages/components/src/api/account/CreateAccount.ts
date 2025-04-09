import MakeRequest from "../MakeRequest";

export interface CreateAccountRequest {
  username: string,
  email_address: string,
  password: string,
  password_confirmation: string,
}

export interface CreateAccountResponse {
  success: boolean,
  error_type?: string,
  error_fields?: { [key: string]: string; },
}

export const CreateAccount = MakeRequest<string, CreateAccountRequest, CreateAccountResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/create_account",
});
