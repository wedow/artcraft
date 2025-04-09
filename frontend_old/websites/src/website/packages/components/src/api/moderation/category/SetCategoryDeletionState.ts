import { ApiConfig } from "@storyteller/components";

export interface SetCategoryDeletionStateSuccessResponse {
  success: boolean,
}

export interface SetCategoryDeletionStateErrorResponse {
  success: boolean,
}

type SetCategoryDeletionStateResponse = SetCategoryDeletionStateSuccessResponse | SetCategoryDeletionStateErrorResponse;

export function SetCategoryDeletionStateIsSuccess(response: SetCategoryDeletionStateResponse): response is SetCategoryDeletionStateSuccessResponse {
  return response?.success === true;
}

export function SetCategoryDeletionStateIsError(response: SetCategoryDeletionStateResponse): response is SetCategoryDeletionStateErrorResponse {
  return response?.success === false;
}

export async function SetCategoryDeletionState(categoryToken: string, setDeleted: boolean) : Promise<SetCategoryDeletionStateResponse> 
{
  const endpoint = new ApiConfig().moderatorSetCategoryDeletionState(categoryToken);

  const request = {
    set_delete: setDeleted,
  }
  
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
