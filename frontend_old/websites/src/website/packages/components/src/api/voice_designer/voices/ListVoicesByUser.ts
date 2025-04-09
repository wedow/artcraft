import MakeRequest from "../../MakeRequest";
import { UserDetailsLight } from "../../_common/UserDetailsLight";

export interface ListVoicesByUserRequest {}

export interface Voice {
    voice_token: string,
    title: string,

    ietf_language_tag: string,
    ietf_primary_language_subtag: string,

    creator: UserDetailsLight,
    creator_set_visibility: string,

    created_at: Date,
    updated_at: Date,
}

export interface ListVoicesByUserResponse {
    success: boolean,
    voices: Voice[],
}

export const ListVoicesByUser = MakeRequest<string, ListVoicesByUserRequest, ListVoicesByUserResponse, {}>({
    method: "GET", 
    routingFunction: (userName:  string) => `/v1/voice_designer/voice/user/${ userName }/list`,
});
