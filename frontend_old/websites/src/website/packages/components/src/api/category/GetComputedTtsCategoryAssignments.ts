import { ApiConfig } from "@storyteller/components";

export interface GetComputedTtsCategoryAssignmentsSuccessResponse {
  success: boolean,
  // NB: Not in use yet.
  //utilized_tts_category_tokens: undefined,
  category_token_to_tts_model_tokens: ModelTokensByCategoryToken,
}

// NB: Not in use yet.
//export interface UtilizedCategoryTokens {
//  recursive: Set<string>,
//  leaf_only: Set<string>,
//}

export interface ModelTokensByCategoryToken {
  recursive: Map<string, Set<string>>,
  // NB: Not in use yet.
  //leaf_only: Map<string, Set<string>>,
}

export interface GetComputedTtsCategoryAssignmentsErrorResponse {
  success: boolean,
}

type GetComputedTtsCategoryAssignmentsResponse = GetComputedTtsCategoryAssignmentsSuccessResponse | GetComputedTtsCategoryAssignmentsErrorResponse;

export function GetComputedTtsCategoryAssignmentsIsOk(response: GetComputedTtsCategoryAssignmentsResponse): response is GetComputedTtsCategoryAssignmentsSuccessResponse {
  return response?.success === true;
}

export function GetComputedTtsCategoryAssignmentsIsError(response: GetComputedTtsCategoryAssignmentsResponse): response is GetComputedTtsCategoryAssignmentsErrorResponse {
  return response?.success === false;
}

export async function GetComputedTtsCategoryAssignments() : Promise<GetComputedTtsCategoryAssignmentsResponse> 
{
  const endpoint = new ApiConfig().getComputedTtsCategoryAssignments();

  console.error('GetComputedTtsCategoryAssignments')
  
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

    if (GetComputedTtsCategoryAssignmentsIsOk(res)) {
      // NB: Cast to appropriate types.
      if (res.category_token_to_tts_model_tokens.recursive !== undefined) {
        let entries : [string, Set<string>][] = Object.entries(res.category_token_to_tts_model_tokens.recursive).map(([category_token, model_tokens]) => {
            return [category_token, new Set(model_tokens)];
        });
        res.category_token_to_tts_model_tokens.recursive = new Map(entries);
      }
      return res;
    } else {
      return { success : false };
    }
  })
  .catch(e => {
    return { success : false };
  });
}
