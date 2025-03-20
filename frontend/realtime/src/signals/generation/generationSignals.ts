import { signal } from "@preact/signals-react";

export enum GenerationLoadingState {
  INIT,
  GENERATING,
  GENERATED,
}

export const generationSignal = signal<{
    loadingState: GenerationLoadingState;
    prompt: string;
  imageB64?: string;
}>({ loadingState: GenerationLoadingState.INIT, prompt: "" });