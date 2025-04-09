import MakeRequest from "../../MakeRequest";
import { UserDetailsLight } from "../../_common/UserDetailsLight";

export interface GetDatasetRequest {}

export interface GetDatasetResponse {
  dataset_token: string;
  title: string;

  ietf_language_tag: string;
  ietf_primary_language_subtag: string;

  creator: UserDetailsLight;
  creator_set_visibility: string;

  created_at: Date;
  updated_at: Date;
}

export const GetDataset = MakeRequest<string, GetDatasetRequest, GetDatasetResponse, {}>({
  method: "GET",
  routingFunction: (datasetToken: string) =>
    `/v1/voice_designer/dataset/${datasetToken}`,
});
