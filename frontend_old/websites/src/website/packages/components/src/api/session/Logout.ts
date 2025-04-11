import MakeRequest from "../MakeRequest";

export interface LogoutResponse {
  success: boolean;
}

export const Logout = MakeRequest<string, {}, LogoutResponse, {}>({
  method: "POST",
  routingFunction: () => "/v1/logout",
});
