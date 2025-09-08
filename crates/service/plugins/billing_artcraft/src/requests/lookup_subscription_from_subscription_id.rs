use crate::configs::stripe_client_retry_strategy::STRIPE_CLIENT_RETRY_STRATEGY;
use crate::requests::lookup_purchase_from_payment_intent_success::PurchaseSummary;
use crate::utils::expand_ids::expand_customer_id::expand_customer_id;
use crate::utils::expand_ids::expand_product_id::expand_product_id;
use crate::utils::metadata::get_metadata_user_token::get_metadata_user_token;
use log::{error, warn};
use stripe::{Client, StripeRequest};
use stripe_billing::subscription::RetrieveSubscription;
use stripe_checkout::checkout_session::{ListCheckoutSession, ListLineItemsCheckoutSession};
use stripe_shared::{CheckoutSession, CheckoutSessionItem, PriceType, Subscription};
use stripe_types::List;
use tokens::tokens::users::UserToken;

pub struct SubscriptionAndProduct {
  pub subscription: Subscription,
  pub subscription_id: String,
  pub product_id: String,
  pub customer_id: String,
  pub price_id: String,
  pub maybe_user_token: Option<UserToken>,
}
pub async fn lookup_subscription_from_subscription_id(
  subscription_id: &str,
  stripe_client: &Client
) -> anyhow::Result<SubscriptionAndProduct> {

  let subscription = RetrieveSubscription::new(subscription_id)
      .build()
      .customize::<Subscription>()
      .request_strategy(STRIPE_CLIENT_RETRY_STRATEGY)
      .send(stripe_client)
      .await
      .map_err(|err| {
        error!("Stripe Error looking up subscription for subscription id{}: {:?}", &subscription_id, err);
        err
      })?;

  if subscription.items.data.len() != 1 {
    warn!("Unexpected number of line items: {} for subscription {}", subscription.items.data.len(), subscription_id);
  }

  let line_item = subscription
      .items
      .data
      .get(0)
      .ok_or_else(|| anyhow::anyhow!("No line items found in subscription."))?;

  let price = &line_item.price;

  match price.type_ {
    PriceType::OneTime => {}
    PriceType::Recurring => {}
  }

  let price_id = price.id.to_string();
  let product_id = expand_product_id(&price.product);
  let customer_id = expand_customer_id(&subscription.customer);

  let maybe_user_token = get_metadata_user_token(&subscription.metadata);

  //let quantity = line_item.quantity.unwrap_or(1);

  Ok(SubscriptionAndProduct {
    subscription,
    subscription_id: subscription_id.to_string(),
    product_id,
    customer_id,
    price_id,
    maybe_user_token,
  })
}
