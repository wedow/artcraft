import { ApiConfig } from "@storyteller/components";

export interface ListTtsCategoriesForModelSuccessResponse {
  success: boolean,
  categories: Array<TtsModelCategory>
}

export interface TtsModelCategory {
  category_token: string,
  model_type: string,
  maybe_super_category_token?: string,

  can_directly_have_models: boolean,
  can_have_subcategories: boolean,
  can_only_mods_apply: boolean,

  name: string,
  maybe_dropdown_name?: string,

  is_mod_approved?: boolean,

  category_created_at: Date,
  category_updated_at: Date,
  category_deleted_at?: Date,
}

export interface ListTtsCategoriesForModelErrorResponse {
  success: boolean,
}

type ListTtsCategoriesForModelResponse = ListTtsCategoriesForModelSuccessResponse | ListTtsCategoriesForModelErrorResponse;

export function ListTtsCategoriesForModelIsOk(response: ListTtsCategoriesForModelResponse): response is ListTtsCategoriesForModelSuccessResponse {
  return response?.success === true;
}

export function ListTtsCategoriesForModelIsError(response: ListTtsCategoriesForModelResponse): response is ListTtsCategoriesForModelErrorResponse {
  return response?.success === false;
}

export async function ListTtsCategoriesForModel(ttsModelToken: string) : Promise<ListTtsCategoriesForModelResponse> 
{
  const endpoint = new ApiConfig().listTtsCategoriesForModel(ttsModelToken);
  
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
