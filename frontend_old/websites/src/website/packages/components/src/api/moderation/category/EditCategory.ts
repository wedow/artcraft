import { ApiConfig } from "@storyteller/components";

export interface EditCategoryRequest {
  name: string,

  maybe_dropdown_name?: string,
  maybe_super_category_token?: string,

  can_directly_have_models: boolean,
  can_have_subcategories: boolean,
  can_only_mods_apply: boolean,

  is_mod_approved: boolean,
  maybe_mod_comments?: string,
}

export interface EditCategorySuccessResponse {
  success: boolean,
}

export interface EditCategoryErrorResponse {
  success: boolean,
  //error_message: string,
  //error_type: string,
  //error_fields: { [key: string]: string; },
}

type EditCategoryResponse = EditCategorySuccessResponse | EditCategoryErrorResponse;

export function EditCategoryIsSuccess(response: EditCategoryResponse): response is EditCategorySuccessResponse {
  return response?.success === true;
}

export function EditCategoryIsError(response: EditCategoryResponse): response is EditCategoryErrorResponse {
  return response?.success === false;
}

export async function EditCategory(categoryToken: string, request: EditCategoryRequest) : Promise<EditCategoryResponse> 
{
  const endpoint = new ApiConfig().moderatorEditCategory(categoryToken);
  
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
