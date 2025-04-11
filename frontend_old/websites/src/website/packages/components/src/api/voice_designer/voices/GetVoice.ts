import MakeRequest from "../../MakeRequest";
import { UserDetailsLight } from "../../_common/UserDetailsLight";

export interface GetVoiceRequest {}

export interface GetVoiceResponse {
  voice_token: string;
  title: string;

  ietf_language_tag: string;
  ietf_primary_language_subtag: string;

  creator: UserDetailsLight;
  creator_set_visibility: string;

  created_at: Date;
  updated_at: Date;
}

export const GetVoice = MakeRequest<string, GetVoiceRequest, GetVoiceResponse, {}>({
  method: "GET",
  routingFunction: (voiceToken: string) =>
    `/v1/voice_designer/voice/${voiceToken}`,
});
