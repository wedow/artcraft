import MakeRequest from "../../MakeRequest";
import { UserDetailsLight } from "../../_common/UserDetailsLight";

export interface ListDatasetsByUserRequest {}

export interface Dataset {
    dataset_token: string,
    title: string,
    
    ietf_language_tag: string,
    ietf_primary_language_subtag: string,

    creator: UserDetailsLight,
    creator_set_visibility: string,

    created_at: Date,
    updated_at: Date,
}

export interface ListDatasetsByUserResponse {
    success: boolean,
    datasets: Dataset[],
}

export const ListDatasetsByUser = MakeRequest<string, ListDatasetsByUserRequest, ListDatasetsByUserResponse, {}>({
    method: "GET", 
    routingFunction: (userName:  string) => `/v1/voice_designer/dataset/user/${ userName }/list`,
});
