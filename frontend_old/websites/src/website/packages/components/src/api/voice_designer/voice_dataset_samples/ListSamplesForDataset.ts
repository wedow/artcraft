import MakeRequest from "../../MakeRequest";

export interface ListSamplesForDatasetRequest {}

export interface ListSamplesForDatasetResponse {
    samples: any,
    success: true
}

export const ListSamplesForDataset = MakeRequest<string, ListSamplesForDatasetRequest, ListSamplesForDatasetResponse,{}>({
    method: "GET", 
    routingFunction: (datasetToken:  string) => `/v1/voice_designer/sample/dataset/${ datasetToken }/list`,
});
