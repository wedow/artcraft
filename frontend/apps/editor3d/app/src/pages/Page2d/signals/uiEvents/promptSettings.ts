import { effect, signal } from "@preact/signals-react";

// Prompt settings
// - Prompt text
// - Prompt strength
export const DEFAULT_PROMPT_TEXT: string = "";
export const promptText = signal<string>(DEFAULT_PROMPT_TEXT);
const setPrompt = (data: string) => {
  promptText.value = data;
};

const onPromptTextChanged = (callback: (data: string) => void) => {
  effect(() => {
    if (promptText.value) {
      callback(promptText.value);
    }
  });
};

export const DEFAULT_PROMPT_STRENGTH = 100;
export const promptStrength = signal<number>(DEFAULT_PROMPT_STRENGTH);
const setPromptStrength = (data: number) => {
  // Round to integer, then clamp between 0 and 100
  promptStrength.value = Math.max(0, Math.min(100, Math.round(data)));
};

const onPromptStrengthChanged = (callback: (data: number) => void) => {
  effect(() => {
    if (promptStrength.value) {
      callback(promptStrength.value);
    }
  });
};

//EXPORTS
export const dispatchers = {
  setPrompt,
  setPromptStrength,
};

export const events = {
  onPromptTextChanged,
  onPromptStrengthChanged,
};
