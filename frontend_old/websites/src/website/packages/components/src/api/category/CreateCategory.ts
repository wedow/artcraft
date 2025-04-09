import { ApiConfig } from "@storyteller/components";

export interface CreateCategoryRequest {
  name: string,
  model_type: string,
  idempotency_token: string,
  // Moderator-only
  can_directly_have_models?: boolean,
  can_have_subcategories?: boolean,
  can_only_mods_apply?: boolean,
}

export interface CreateCategorySuccessResponse {
  success: boolean,
}

export interface CreateCategoryErrorResponse {
  success: boolean,
  //error_message: string,
  //error_type: string,
  //error_fields: { [key: string]: string; },
}

type CreateCategoryResponse = CreateCategorySuccessResponse | CreateCategoryErrorResponse;

export function CreateCategoryIsSuccess(response: CreateCategoryResponse): response is CreateCategorySuccessResponse {
  return response?.success === true;
}

export function CreateCategoryIsError(response: CreateCategoryResponse): response is CreateCategoryErrorResponse {
  return response?.success === false;
}

export async function CreateCategory(request: CreateCategoryRequest) : Promise<CreateCategoryResponse> 
{
  const endpoint = new ApiConfig().createCategory();
  
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
