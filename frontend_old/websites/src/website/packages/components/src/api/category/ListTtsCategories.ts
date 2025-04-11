import { ApiConfig } from "@storyteller/components";

export interface ListTtsCategoriesSuccessResponse {
  success: boolean,
  categories: Array<TtsCategory>
}

export interface TtsCategory {
  category_token: string,
  model_type: string,
  maybe_super_category_token?: string,

  can_directly_have_models: boolean,
  can_have_subcategories: boolean,
  can_only_mods_apply: boolean,

  name: string,
  name_for_dropdown: string,

  is_mod_approved?: boolean,

  created_at: Date,
  updated_at: Date,
  deleted_at?: Date,
}

export interface ListTtsCategoriesErrorResponse {
  success: boolean,
}

type ListTtsCategoriesResponse = ListTtsCategoriesSuccessResponse | ListTtsCategoriesErrorResponse;

export function ListTtsCategoriesIsOk(response: ListTtsCategoriesResponse): response is ListTtsCategoriesSuccessResponse {
  return response?.success === true;
}

export function ListTtsCategoriesIsError(response: ListTtsCategoriesResponse): response is ListTtsCategoriesErrorResponse {
  return response?.success === false;
}

export async function ListTtsCategories() : Promise<ListTtsCategoriesResponse> 
{
  const endpoint = new ApiConfig().listTtsCategories();
  
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
