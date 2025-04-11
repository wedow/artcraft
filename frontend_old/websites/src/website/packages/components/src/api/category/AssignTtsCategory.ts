import { ApiConfig } from "@storyteller/components";

export interface AssignTtsCategoryRequest {
  category_token: string,
  tts_model_token: string,
  // Whether to add or delete the assignment
  assign: boolean,
}

export interface AssignTtsCategorySuccessResponse {
  success: boolean,
}

export interface AssignTtsCategoryErrorResponse {
  success: boolean,
}

type AssignTtsCategoryResponse = AssignTtsCategorySuccessResponse | AssignTtsCategoryErrorResponse;

export function AssignTtsCategoryIsOk(response: AssignTtsCategoryResponse): response is AssignTtsCategorySuccessResponse {
  return response?.success === true;
}

export function AssignTtsCategoryIsError(response: AssignTtsCategoryResponse): response is AssignTtsCategoryErrorResponse {
  return response?.success === false;
}

export async function AssignTtsCategory(request: AssignTtsCategoryRequest) : Promise<AssignTtsCategoryResponse> 
{
  const endpoint = new ApiConfig().assignTtsCategory();
  
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
      return { success : false }; // TODO: This loses error semantics and is deprecated
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
