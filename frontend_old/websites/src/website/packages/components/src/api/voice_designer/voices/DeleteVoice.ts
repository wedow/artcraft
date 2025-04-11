import MakeRequest from "../../MakeRequest";

export interface DeleteVoiceRequest {
  set_delete: boolean;
  as_mod: boolean;
}

export interface DeleteVoiceResponse {
  success: boolean;
}

export const DeleteVoice = MakeRequest<string, DeleteVoiceRequest, DeleteVoiceResponse, {}>({
  method: "DELETE",
  routingFunction: (voiceToken: string) =>
    `/v1/voice_designer/voice/${voiceToken}/delete`,
});
