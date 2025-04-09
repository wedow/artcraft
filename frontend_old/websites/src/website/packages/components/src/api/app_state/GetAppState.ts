import MakeRequest from "../MakeRequest";
import { UserDetailsLight } from "../_common/UserDetailsLight";

export interface UserLocale {
  full_language_tags: [string, string];
  language_codes: [string, string];
}

export interface ServerAlert {
  maybe_category: string;
  maybe_message: string;
}

export interface ActiveSubscription {
  namespace: string;
  product_slug: string;
}

export interface PremiumStatus {
  active_subscriptions: ActiveSubscription[];
  has_free_premium: boolean;
  has_paid_premium: boolean;
  has_premium: boolean;
  maybe_loyalty_program: string | null;
}

export type FeatureFlags =
  | "explore_media"
  | "studio"
  | "upload_3d"
  | "video_style_transfer";

export interface UserPermissions {
  feature_flags: FeatureFlags[];
  is_moderator: boolean;
  legacy_permission_flags: {
    can_approve_w2l_templates: boolean;
    can_ban_users: boolean;
    can_delete_other_users_tts_models: boolean;
    can_delete_other_users_tts_results: boolean;
    can_delete_other_users_w2l_results: boolean;
    can_delete_other_users_w2l_templates: boolean;
    can_delete_own_account: boolean;
    can_delete_own_tts_models: boolean;
    can_delete_own_tts_results: boolean;
    can_delete_own_w2l_results: boolean;
    can_delete_own_w2l_templates: boolean;
    can_delete_users: boolean;
    can_edit_other_users_profiles: boolean;
    can_edit_other_users_tts_models: boolean;
    can_edit_other_users_w2l_templates: boolean;
    can_upload_tts_models: boolean;
    can_upload_w2l_templates: boolean;
    can_use_tts: boolean;
    can_use_w2l: boolean;
  };
}

export interface GetAppStateRequest {}

export interface GetAppStateResponse {
  is_banned: boolean;
  is_logged_in: boolean;
  locale: UserLocale;
  maybe_alert: ServerAlert | null;
  maybe_premium: PremiumStatus | null;
  maybe_user_info: UserDetailsLight | null;
  permissions: UserPermissions;
  refresh_interval_millis: number;
  server_info: {
    build_sha: string;
    build_sha_short: string;
    hostname: string;
  };
  success: boolean;
}

export const GetAppState = MakeRequest<
  string,
  GetAppStateRequest,
  GetAppStateResponse,
  {}
>({
  method: "GET",
  routingFunction: () => `/v1/app_state`,
});
