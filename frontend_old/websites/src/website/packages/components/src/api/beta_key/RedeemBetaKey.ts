import MakeRequest from "../MakeRequest";

export interface RedeemBetaKeyRequest {
  beta_key: string;
}

export interface RedeemBetaKeyResponse {
  success: boolean;
}

export const RedeemBetaKey = MakeRequest<
  string,
  RedeemBetaKeyRequest,
  RedeemBetaKeyResponse,
  {}
>({
  method: "POST",
  routingFunction: () => "/v1/beta_keys/redeem",
});
