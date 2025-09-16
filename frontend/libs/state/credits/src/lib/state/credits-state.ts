import { create } from 'zustand'
import { ArtcraftGetCredits } from "@storyteller/tauri-api";

export interface CreditsState {
  // Daily free credits (if/when we offer them)
  freeCredits: number,

  // Credits refilled monthly with a subscription
  monthlyCredits: number,

  // Credits the user purchases individually
  bankedCredits: number,

  // Total credits available
  totalCredits: number,

  // Call to fetch credits from the server
  fetchFromServer: () => Promise<void>
}

export const useCreditsState = create<CreditsState>()((set) => ({
  freeCredits: 0,
  monthlyCredits: 0,
  bankedCredits: 0,
  totalCredits: 0,

  // Call to fetch credits from the server
  fetchFromServer: async () => {
    const data = await ArtcraftGetCredits(); 
    if (!!data.payload) {
      set((state) => ({
        freeCredits: data.payload.free_credits,
        monthlyCredits: data.payload.monthly_credits,
        bankedCredits: data.payload.banked_credits,
        totalCredits: data.payload.sum_total_credits,
      }));
    }
  }
}))