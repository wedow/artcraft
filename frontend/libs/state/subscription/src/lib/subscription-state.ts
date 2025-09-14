import { create } from 'zustand'
import { ArtcraftGetSubscription } from "@storyteller/tauri-api";

interface SubscriptionState {
  /// If the user doesn't have a subscription, this will be undefined.
  subscriptionInfo?: SubscriptionInfo,

  // Call to fetch credits from the server
  fetchFromServer: () => Promise<void>
}

interface SubscriptionInfo {
  /// The internal user unique ID for the subscription
  subscriptionToken: string,

  // TODO: This should be an enum! 
  /// The internal identifier of the subscription
  productSlug: string,
  
  /// The namespace for the subscription ("artcraft" or "fakeyou")
  namespace: string,
}

export const useSubscriptionState = create<SubscriptionState>()((set) => ({
  subscriptionInfo: undefined,

  // Call to fetch credits from the server
  fetchFromServer: async () => {
    const data = await ArtcraftGetSubscription(); 
    if (!!data.payload) {
      let activeSubscription = undefined;
      if (!!data.payload.active_subscription) {
        activeSubscription = {
          subscriptionToken: data.payload.active_subscription.subscription_token,
          productSlug: data.payload.active_subscription.product_slug,
          namespace: data.payload.active_subscription.namespace,
        };
      }
      set((state) => ({
        subscriptionInfo: activeSubscription,
      }));
    }
  }
}))