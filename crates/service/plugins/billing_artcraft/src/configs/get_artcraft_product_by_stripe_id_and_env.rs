use crate::configs::stripe_artcraft_product_info::StripeArtcraftProductInfo;
use crate::configs::stripe_artcraft_product_info_list::{ARTCRAFT_BASIC_PRODUCTION, ARTCRAFT_BASIC_SANDBOX, ARTCRAFT_MAX_PRODUCTION, ARTCRAFT_MAX_SANDBOX, ARTCRAFT_PRO_PRODUCTION, ARTCRAFT_PRO_SANDBOX};
use once_cell::sync::Lazy;
use reusable_types::server_environment::ServerEnvironment;
use std::collections::HashMap;


static PRODUCTION_PRODUCTS_BY_STRIPE_ID : Lazy<HashMap<String, StripeArtcraftProductInfo>> = Lazy::new(|| {
  let mut plans = HashMap::new();
  
  fn add_plan(plans: &mut HashMap<String, StripeArtcraftProductInfo>, product: &StripeArtcraftProductInfo) {
    plans.insert(product.product_id.to_string(), product.clone());
  }

  add_plan(&mut plans, &ARTCRAFT_BASIC_PRODUCTION);
  add_plan(&mut plans, &ARTCRAFT_PRO_PRODUCTION);
  add_plan(&mut plans, &ARTCRAFT_MAX_PRODUCTION);

  plans
});

static SANDBOX_PRODUCTS_BY_STRIPE_ID : Lazy<HashMap<String, StripeArtcraftProductInfo>> = Lazy::new(|| {
  let mut plans = HashMap::new();

  fn add_plan(plans: &mut HashMap<String, StripeArtcraftProductInfo>, product: &StripeArtcraftProductInfo) {
    plans.insert(product.product_id.to_string(), product.clone());
  }

  add_plan(&mut plans, &ARTCRAFT_BASIC_SANDBOX);
  add_plan(&mut plans, &ARTCRAFT_PRO_SANDBOX);
  add_plan(&mut plans, &ARTCRAFT_MAX_SANDBOX);

  plans
});

pub fn get_artcraft_product_by_stripe_id_and_env(stripe_id: &str, env: ServerEnvironment) -> Option<&StripeArtcraftProductInfo> {
  match env {
    ServerEnvironment::Development => SANDBOX_PRODUCTS_BY_STRIPE_ID.get(stripe_id),
    ServerEnvironment::Production => PRODUCTION_PRODUCTS_BY_STRIPE_ID.get(stripe_id),
  }
}
