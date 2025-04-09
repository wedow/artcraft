import { ApiConfig } from "@storyteller/components";

export interface CreateCommentRequest {
  uuid_idempotency_token: string,
  // Valid values for entity_type: 'user', 'tts_model', 'tts_result', 'w2l_template', 'w2l_result'
  entity_type: string,
  entity_token: string,
  comment_markdown: string,
}

export interface CreateCommentSuccessResponse {
  success: boolean,
  comment_token: string,
}

export interface CreateCommentErrorResponse {
  success: boolean,
}

type CreateCommentResponse = CreateCommentSuccessResponse | CreateCommentErrorResponse;

export function CreateCommentIsOk(response: CreateCommentResponse): response is CreateCommentSuccessResponse {
  return response?.success === true;
}

export function CreateCommentIsError(response: CreateCommentResponse): response is CreateCommentErrorResponse {
  return response?.success === false;
}

export async function CreateComment(request: CreateCommentRequest) : Promise<CreateCommentResponse> 
{
  const endpoint = new ApiConfig().commentCreate();
  
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
