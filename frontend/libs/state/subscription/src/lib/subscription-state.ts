import { create } from 'zustand'
import { ArtcraftGetSubscription } from "@storyteller/tauri-api";

interface SubscriptionState {
  /// If the user doesn't have a subscription, this will be undefined.
  subscriptionInfo?: SubscriptionInfo,

  // Returns true if the user has a paid plan.
  // (We do not store "free" as a plan.)
  hasPaidPlan: () => boolean;

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

  /// The next billing date for the subscription
  nextBillAt?: Date,
}

export const useSubscriptionState = create<SubscriptionState>()((set, get) => ({
  subscriptionInfo: undefined,

  // Returns true if the user has a paid plan.
  // (We do not store "free" as a plan.)
  hasPaidPlan: () => get().subscriptionInfo?.subscriptionToken !== undefined,

  // Call to fetch credits from the server
  fetchFromServer: async () => {
    const data = await ArtcraftGetSubscription(); 
    if (!!data.payload) {
      let activeSubscription = undefined;
      console.log(">>> subscription data.payload", data.payload);
      if (!!data.payload.active_subscription) {
        activeSubscription = {
          subscriptionToken: data.payload.active_subscription.subscription_token,
          productSlug: data.payload.active_subscription.product_slug,
          namespace: data.payload.active_subscription.namespace,
          nextBillAt: data.payload.active_subscription.next_bill_at ? new Date(data.payload.active_subscription.next_bill_at) : undefined,
        };
      }
      console.log(">>> activeSubscription", activeSubscription);
      set((state) => ({
        subscriptionInfo: activeSubscription,
      }));
    }
  }
}))