import MakeRequest from "../../MakeRequest";

export interface UpdateVoiceRequest {
  title: string,
  creator_set_visibility: string,
  ietf_language_tag: string,
}

export interface UpdateVoiceResponse {
    success: boolean,
}

export const UpdateVoice = MakeRequest<string, UpdateVoiceRequest, UpdateVoiceResponse, {}>({
    method: "POST", 
    routingFunction: (voiceToken:  string) => `/v1/voice_designer/voice/${ voiceToken }/update`,
});
