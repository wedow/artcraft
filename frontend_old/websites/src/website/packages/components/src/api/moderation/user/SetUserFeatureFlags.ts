import MakeRequest from "../../MakeRequest";

export interface SetUserFeatureFlagsRequest {
  action: Action,
}

export interface Action {
  SetExactFlags?: SetExactFlagsArgs,
}

export interface SetExactFlagsArgs {
  flags: string[],
}

export interface SetUserFeatureFlagsResponse {
  success: boolean
}

export const SetUserFeatureFlags = MakeRequest<string, SetUserFeatureFlagsRequest, SetUserFeatureFlagsResponse,{}>({
  method: "POST",
  routingFunction: (username: string) => `/v1/moderation/user_feature_flags/${username}`,
});
