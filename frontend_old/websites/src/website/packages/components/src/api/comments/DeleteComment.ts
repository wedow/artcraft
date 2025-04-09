import { ApiConfig } from "@storyteller/components";

export interface DeleteCommentRequest {
  // If a user is both an *author* and *mod*, this controls how to delete the comment.
  // Entirely optional! So we'll ignore it for now.
  as_mod: boolean | null | undefined,
}

export interface DeleteCommentSuccessResponse {
  success: boolean,
}

export interface DeleteCommentErrorResponse {
  success: boolean,
}

type DeleteCommentResponse = DeleteCommentSuccessResponse | DeleteCommentErrorResponse;

export function DeleteCommentIsOk(response: DeleteCommentResponse): response is DeleteCommentSuccessResponse {
  return response?.success === true;
}

export function DeleteCommentIsError(response: DeleteCommentResponse): response is DeleteCommentErrorResponse {
  return response?.success === false;
}

export async function DeleteComment(commentToken: string) : Promise<DeleteCommentResponse> 
{
  const endpoint = new ApiConfig().commentDelete(commentToken);
  
  const request = {}; // TODO: Control moderator scope. (Entirely optional for now.)

  return await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  })
  .then(res => res.json())
  .then(res => {
    if (!res) {
      return { success : false };
    }

    if (res && 'success' in res) {
      return res;
    } else {
      return { success : false };
    }
  })
  .catch(e => {
    return { success : false };
  });
}
