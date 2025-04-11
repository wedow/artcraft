import MakeRequest from "../../MakeRequest";

export interface CreateDatasetRequest {
  title: string,
  creator_set_visibility: string,
  idempotency_token: string,
}

export interface CreateDatasetResponse {
  success: boolean,
  token: string,
}

export const CreateDataset = MakeRequest<string, CreateDatasetRequest, CreateDatasetResponse,{}>({
    method: "POST", 
    routingFunction: () => "/v1/voice_designer/dataset/create",
});
