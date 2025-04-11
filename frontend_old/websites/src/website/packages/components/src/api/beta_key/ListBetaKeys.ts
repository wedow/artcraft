import MakeRequest from "../MakeRequest";
import { Pagination } from "../_common/SharedFetchTypes";

export interface BetaKey {
  created_at: Date;
  creator: {
    default_avatar: {
      color_index: number;
      image_index: number;
    };
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
  };
  key_value: string;
  maybe_redeemed_at?: Date;
  maybe_redeemer?: {
    default_avatar: {
      color_index: number;
      image_index: number;
    };
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
  } | null;
  maybe_referrer?: {
    default_avatar: {
      color_index: number;
      image_index: number;
    };
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
  } | null;
  product: string;
  token: string;
  maybe_note?: string;
  maybe_note_html?: string;
}

export interface ListBetaKeysRequest {}

export interface ListBetaKeysResponse {
  beta_keys: BetaKey[];
  pagination: Pagination;
  success: boolean;
}

export const ListBetaKeys = MakeRequest<
  string,
  ListBetaKeysRequest,
  ListBetaKeysResponse,
  {}
>({
  method: "GET",
  routingFunction: () => "/v1/beta_keys/list",
});
