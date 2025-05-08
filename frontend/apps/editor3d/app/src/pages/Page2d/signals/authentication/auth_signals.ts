import { computed, signal } from "@preact/signals-react";


export interface CoreInfo {
  default_avatar: {
    color_index: number;
    image_index: number;
  };
  display_name: string;
  gravatar_hash: string;
  user_token: string;
  username: string;
}

export interface UserInfo {
  user_token: string;
  username: string;
  display_name: string;
  email_gravatar_hash: string;

  core_info: CoreInfo;

  // Rollout feature flags
  can_access_studio: boolean;
  //maybe_feature_flags: USER_FEATURE_FLAGS[];

  // Usage
  can_use_tts: boolean;
  can_use_w2l: boolean;
  can_delete_own_tts_results: boolean;
  can_delete_own_w2l_results: boolean;
  can_delete_own_account: boolean;

  // Contribution
  can_upload_tts_models: boolean;
  can_upload_w2l_templates: boolean;
  can_delete_own_tts_models: boolean;
  can_delete_own_w2l_templates: boolean;

  // Moderation
  can_approve_w2l_templates: boolean;
  can_edit_other_users_profiles: boolean;
  can_edit_other_users_tts_models: boolean;
  can_edit_other_users_w2l_templates: boolean;
  can_delete_other_users_tts_models: boolean;
  can_delete_other_users_tts_results: boolean;
  can_delete_other_users_w2l_templates: boolean;
  can_delete_other_users_w2l_results: boolean;
  can_ban_users: boolean;
  can_delete_users: boolean;
}




// import { ActiveSubscriptions } from "@ApiManager/models/Billing";
// import { LoyaltyProgram } from "@ApiManager/enums/Billing";
// import { USER_FEATURE_FLAGS } from "@ApiManager/enums/UserFeatures";

import { AUTH_STATUS } from "./enums";

const status = signal<AUTH_STATUS>(AUTH_STATUS.INIT);
const userInfo = signal<UserInfo | undefined>(undefined);

const hasAccess = computed(() => {
  if (
    userInfo.value === undefined ||
    userInfo.value.can_access_studio === undefined
  ) {
    return undefined;
  }
  return userInfo.value.can_access_studio;
});

export const signals = {
  status,
  userInfo,
  hasAccess,
};
