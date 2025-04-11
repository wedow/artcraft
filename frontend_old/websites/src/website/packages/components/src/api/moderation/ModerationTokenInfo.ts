import MakeRequest from "../MakeRequest";

export interface ModerationTokenInfoRequest {}

export interface ModerationTokenInfoResponse {
  success: boolean;
  maybe_payload?: string;
}


export const ModerationTokenInfo = MakeRequest<
  string,
  ModerationTokenInfoRequest,
  ModerationTokenInfoResponse,
  {}
>({
  method: "GET",
  routingFunction: (token: string) =>
    `/moderation/token_info/${token}`,
});
