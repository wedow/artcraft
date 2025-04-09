import { effect, signal } from "@preact/signals-react";

export enum GenerationLoadingState {
  INIT,
  GENERATING,
  GENERATED,
}

const initValue = { loadingState: GenerationLoadingState.INIT, prompt: "" };

export const generationSignal = signal<{
  loadingState: GenerationLoadingState;
  prompt: string;
  imageB64?: string;
}>(initValue);

export const startGeneration = (prompt: string) => {
  generationSignal.value = {
    loadingState: GenerationLoadingState.GENERATING,
    prompt,
    imageB64: undefined,
  };
};

export const onStartGeneration = (callback: (prompt: string) => void) => {
  effect(() => {
    // If value just changed to GENERATING, notify the listeners
    if (
      generationSignal.value.loadingState === GenerationLoadingState.GENERATING
    ) {
      callback(generationSignal.value.prompt);
    }
  });
};

export const finishGeneration = (imageB64: string) => {
  generationSignal.value = {
    loadingState: GenerationLoadingState.GENERATED,
    prompt: generationSignal.value.prompt,
    imageB64,
  };
};

export const cancelGeneration = () => {
  if (
    generationSignal.value.loadingState === GenerationLoadingState.GENERATING
  ) {
    generationSignal.value = initValue;
  }
};
