import { ApiConfig } from "@storyteller/components";

export interface CreateStripePortalRedirectRequest {
  portal_config_id?: string,
}

export interface CreateStripePortalRedirectSuccessResponse {
  success: boolean,
  stripe_portal_redirect_url: string,
}

export interface CreateStripePortalRedirectErrorResponse {
  success: boolean,
}

type CreateStripePortalRedirectResponse = CreateStripePortalRedirectSuccessResponse | CreateStripePortalRedirectErrorResponse;

export function CreateStripePortalRedirectIsSuccess(response: CreateStripePortalRedirectResponse): response is CreateStripePortalRedirectSuccessResponse {
  return response?.success === true;
}

export function CreateStripePortalRedirectIsError(response: CreateStripePortalRedirectResponse): response is CreateStripePortalRedirectErrorResponse {
  return response?.success === false;
}

export async function CreateStripePortalRedirect(portal_config_id?: string) : Promise<CreateStripePortalRedirectResponse> 
{
  const endpoint = new ApiConfig().createStripePortalRedirect();

  const request : CreateStripePortalRedirectRequest = {
    portal_config_id: portal_config_id,
  };
  
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
