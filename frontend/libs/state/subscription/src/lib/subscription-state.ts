import { create } from 'zustand'
import { ArtcraftGetCredits } from "@storyteller/tauri-api";

interface SubscriptionState {
  /// If the user doesn't have a subscription, this will be undefined.
  subscriptionInfo?: SubscriptionInfo,

  // Call to fetch credits from the server
  fetchFromServer: () => Promise<void>
}

interface SubscriptionInfo {
  /// The internal user unique ID for the subscription
  subscriptionToken: string,

  /// The internal identifier of the subscription
  productSlug: string,
  
  /// The namespace for the subscription ("artcraft" or "fakeyou")
  namespace: string,
}

export const useSubscriptionState = create<SubscriptionState>()((set) => ({
  subscriptionInfo: undefined,

  // Call to fetch credits from the server
  fetchFromServer: async () => {
    const data = await ArtcraftGetCredits(); 
    if (!!data.payload) {
      set((state) => ({
        subscriptionInfo: undefined,
      }));
    }
  }
}))