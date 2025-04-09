import MakeRequest from "../../MakeRequest";

export interface DeleteSampleRequest {
  set_delete: boolean;
  as_mod: boolean;
}

export interface DeleteSampleResponse {
  success: boolean
}

export const DeleteSample = MakeRequest<string, DeleteSampleRequest, DeleteSampleResponse,{}>({
  method: "DELETE", 
  routingFunction: (sampleToken:  string) => `/v1/voice_designer/sample/${ sampleToken }/delete`,
});
