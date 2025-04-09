import { ApiConfig } from "@storyteller/components";

export interface GetCategorySuccessResponse {
  success: boolean,
  category: Category,
}

export interface Category {
  category_token: string,
  model_type: string,
  maybe_super_category_token?: string,

  can_directly_have_models: boolean,
  can_have_subcategories: boolean,
  can_only_mods_apply: boolean,

  name: string,
  maybe_dropdown_name?: string,

  creator_user_token?: string,
  creator_username?: string,
  creator_display_name?: string,
  creator_gravatar_hash?: string,

  is_mod_approved?: boolean,
  maybe_mod_comments?: string, // Absent for non-mods

  created_at: Date,
  updated_at: Date,
  deleted_at?: Date,
}

export interface GetCategoryErrorResponse {
  success: boolean,
}

type GetCategoryResponse = GetCategorySuccessResponse | GetCategoryErrorResponse;

export function GetCategoryIsOk(response: GetCategoryResponse): response is GetCategorySuccessResponse {
  return response?.success === true;
}

export function GetCategoryIsError(response: GetCategoryResponse): response is GetCategoryErrorResponse {
  return response?.success === false;
}

export async function GetCategory(categoryToken: string) : Promise<GetCategoryResponse> 
{
  const endpoint = new ApiConfig().getCategory(categoryToken);
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
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
