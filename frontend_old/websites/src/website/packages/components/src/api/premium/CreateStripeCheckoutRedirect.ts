import { ApiConfig } from "@storyteller/components";

export interface CreateStripeCheckoutRedirectRequest {
  internal_plan_key: string,
}

export interface CreateStripeCheckoutRedirectSuccessResponse {
  success: boolean,
  stripe_checkout_redirect_url: string,
}

export interface CreateStripeCheckoutRedirectErrorResponse {
  success: boolean,
}

type CreateStripeCheckoutRedirectResponse = CreateStripeCheckoutRedirectSuccessResponse | CreateStripeCheckoutRedirectErrorResponse;

export function CreateStripeCheckoutRedirectIsSuccess(response: CreateStripeCheckoutRedirectResponse): response is CreateStripeCheckoutRedirectSuccessResponse {
  return response?.success === true;
}

export function CreateStripeCheckoutRedirectIsError(response: CreateStripeCheckoutRedirectResponse): response is CreateStripeCheckoutRedirectErrorResponse {
  return response?.success === false;
}

export async function CreateStripeCheckoutRedirect(internal_plan_key: string) : Promise<CreateStripeCheckoutRedirectResponse> 
{
  const endpoint = new ApiConfig().createStripeCheckoutRedirect();

  const request : CreateStripeCheckoutRedirectRequest = {
    internal_plan_key: internal_plan_key,
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
