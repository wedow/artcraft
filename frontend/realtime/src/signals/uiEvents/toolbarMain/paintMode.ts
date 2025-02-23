// Prompt settings
// - Prompt text

import { effect, signal } from "@preact/signals-react";

// - Prompt strength
export const DEFAULT_PAINT_COLOR: string = "#ff0000";
export const paintColor = signal<string>(DEFAULT_PAINT_COLOR);
export const setPaintColor = (data: string) => {
  paintColor.value = data;
};

export const onPaintColorChanged = (callback: (data: string) => void) => {
  effect(() => {
    if (paintColor.value) {
      callback(paintColor.value);
    }
  });
};
