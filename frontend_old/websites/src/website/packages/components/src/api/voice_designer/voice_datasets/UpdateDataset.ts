import MakeRequest from "../../MakeRequest";

export interface UpdateDatasetRequest {
  title: string,
  creator_set_visibility: string,
  ietf_language_tag: string,
}

export interface UpdateDatasetResponse {
    success: boolean,
}

export const UpdateDataset = MakeRequest<string, UpdateDatasetRequest, UpdateDatasetResponse, {}>({
    method: "POST", 
    routingFunction: (voiceToken:  string) => `/v1/voice_designer/dataset/${ voiceToken }/update`,
});
