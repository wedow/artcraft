import { ApiConfig } from "@storyteller/components";

export interface ListActiveSubscriptionsSuccessResponse {
  success: boolean,
  maybe_loyalty_program?: string,
  active_subscriptions: ActiveSubscription[],
}

export interface ActiveSubscription {
  namespace: string,
  product_slug: string,
}

export interface ListActiveSubscriptionsErrorResponse {
  success: boolean,
}

type ListActiveSubscriptionsResponse = ListActiveSubscriptionsSuccessResponse | ListActiveSubscriptionsErrorResponse;

export function ListActiveSubscriptionsIsSuccess(response: ListActiveSubscriptionsResponse): response is ListActiveSubscriptionsSuccessResponse {
  return response?.success === true;
}

export function ListActiveSubscriptionsIsError(response: ListActiveSubscriptionsResponse): response is ListActiveSubscriptionsErrorResponse {
  return response?.success === false;
}

export async function ListActiveSubscriptions() : Promise<ListActiveSubscriptionsResponse> 
{
  const endpoint = new ApiConfig().listActiveSubscriptions();

  return await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
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
