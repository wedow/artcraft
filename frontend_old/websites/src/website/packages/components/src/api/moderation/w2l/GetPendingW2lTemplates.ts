import { ApiConfig } from "@storyteller/components";

export interface PendingW2lTemplates {
  success: boolean,
  templates: Array<PendingW2lTemplatesEntryForList>
}

export interface PendingW2lTemplatesEntryForList {
  template_token: string,
  title: string,
  template_type: string,
  duration_millis: number,
  frame_width: number,
  frame_height: number,
  creator_user_token: string,
  creator_username: string,
  creator_display_name: string,
  creator_gravatar_hash: string,
  created_at: Date,
}

export enum PendingW2lTemplatesLookupError {
  NotAuthorized,
  ServerError,
  FrontendError,
}

export type GetPendingW2lTemplatesResponse = PendingW2lTemplates | PendingW2lTemplatesLookupError;

export function GetPendingW2lTemplatesIsOk(response: GetPendingW2lTemplatesResponse): response is PendingW2lTemplates {
  return response.hasOwnProperty('templates');
}

export function GetPendingW2lTemplatesIsErr(response: GetPendingW2lTemplatesResponse): response is PendingW2lTemplatesLookupError {
  return !response.hasOwnProperty('templates');
}

interface PendingW2lTemplatesResponsePayload {
  success: boolean,
  error_reason?: string,
  templates?: PendingW2lTemplates,
}


export async function GetPendingW2lTemplates() : Promise<GetPendingW2lTemplatesResponse> 
{
  const endpoint = new ApiConfig().getModerationPendingW2lTemplates();
  
  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  })
  .then(res => res.json())
  .then(res => {
    const response : PendingW2lTemplatesResponsePayload = res;

    if (response?.success) {
      return res as PendingW2lTemplates; // TODO: This is not the way.
    } 

    if (response?.success === false) {
      if (response.error_reason?.includes("authorized")) {
        return PendingW2lTemplatesLookupError.NotAuthorized;
      } else {
        return PendingW2lTemplatesLookupError.ServerError;
      }
    }

    return PendingW2lTemplatesLookupError.FrontendError;
  })
  .catch(e => {
    return PendingW2lTemplatesLookupError.FrontendError;
  });
}