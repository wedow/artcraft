import { effect, signal } from "@preact/signals-react";

// Model loading settings
// - Is loading visible
// - Loading progress percentage
export const DEFAULT_IS_LOADING_VISIBLE = false;
export const isLoadingVisible = signal<boolean>(DEFAULT_IS_LOADING_VISIBLE);
const setIsLoadingVisible = (visible: boolean) => {
  isLoadingVisible.value = visible;
};

const onIsLoadingVisibleChanged = (callback: (visible: boolean) => void) => {
  effect(() => {
    callback(isLoadingVisible.value);
  });
};

export const DEFAULT_LOADING_PROGRESS = 0;
export const loadingProgress = signal<number>(DEFAULT_LOADING_PROGRESS);
const setLoadingProgress = (progress: number) => {
  // Round to integer, then clamp between 0 and 100
  loadingProgress.value = Math.max(0, Math.min(100, Math.round(progress)));
};

const onLoadingProgressChanged = (callback: (progress: number) => void) => {
  effect(() => {
    callback(loadingProgress.value);
  });
};

// Loading text signal
export const DEFAULT_LOADING_TEXT = "Downloading";
export const loadingText = signal<string>(DEFAULT_LOADING_TEXT);
const setLoadingText = (text: string) => {
  loadingText.value = text;
};

const onLoadingTextChanged = (callback: (text: string) => void) => {
  effect(() => {
    callback(loadingText.value);
  });
};

// EXPORTS
export const dispatchers = {
  setIsLoadingVisible,
  setLoadingProgress,
  setLoadingText,
};

export const events = {
  onIsLoadingVisibleChanged,
  onLoadingProgressChanged,
  onLoadingTextChanged,
};
