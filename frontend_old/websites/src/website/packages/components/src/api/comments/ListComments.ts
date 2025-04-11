import { ApiConfig } from "@storyteller/components";
import { UserDetailsLight } from "../_common/UserDetailsLight";

export interface ListCommentsSuccessResponse {
  success: boolean;
  comments: Array<Comment>;
}

export interface Comment {
  token: string;
  user: UserDetailsLight;
  user_token: string;
  username: string;
  user_display_name: string;
  user_gravatar_hash: string;

  comment_markdown: string;
  comment_rendered_html: string;

  created_at: Date;
  updated_at: Date;
  maybe_edited_at?: Date;
}

export interface ListCommentsErrorResponse {
  success: boolean;
}

type ListCommentsResponse =
  | ListCommentsSuccessResponse
  | ListCommentsErrorResponse;

export function ListCommentsIsOk(
  response: ListCommentsResponse
): response is ListCommentsSuccessResponse {
  return response?.success === true;
}

export function ListCommentsIsError(
  response: ListCommentsResponse
): response is ListCommentsErrorResponse {
  return response?.success === false;
}

export async function ListComments(
  entityType: string,
  entityToken: string
): Promise<ListCommentsResponse> {
  const endpoint = new ApiConfig().commentList(entityType, entityToken);

  return await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
  })
    .then(res => res.json())
    .then(res => {
      if (!res) {
        return { success: false }; // TODO: This loses error semantics and is deprecated
      }

      if (res && "success" in res) {
        return res;
      } else {
        return { success: false };
      }
    })
    .catch(e => {
      return { success: false };
    });
}
