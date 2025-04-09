import { CreateStripeCheckoutRedirect, CreateStripeCheckoutRedirectIsError, CreateStripeCheckoutRedirectIsSuccess } from "@storyteller/components/src/api/premium/CreateStripeCheckoutRedirect";

// Redirect the user to a stripe checkout page (new users without an existing subscription only!)
// Returns false is the checkout link creation failed.
export async function BeginStripeCheckoutFlow (internal_plan_key: string): Promise<boolean> {
  const response = await CreateStripeCheckoutRedirect(internal_plan_key);

  if (CreateStripeCheckoutRedirectIsSuccess(response)) {
    window.location.href = response.stripe_checkout_redirect_url;
    return true;
  } else if (CreateStripeCheckoutRedirectIsError(response)) {
    // TODO
  }
  return false;
};
