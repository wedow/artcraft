import MakeRequest from "../../MakeRequest";

export interface DeleteDatasetRequest {
  set_delete: boolean;
  as_mod: boolean;
}

export interface DeleteDatasetResponse {
  success: boolean;
}

export const DeleteDataset = MakeRequest<string, DeleteDatasetRequest,DeleteDatasetResponse,{}>({
  method: "DELETE",
  routingFunction: (voiceToken: string) =>
    `/v1/voice_designer/dataset/${voiceToken}/delete`,
});
