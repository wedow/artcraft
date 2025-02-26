import { signal, effect } from "@preact/signals-react";

export const DEFAULT_BG_COLOR: string = "#ffffff";
export const bgColor = signal<string>(DEFAULT_BG_COLOR);
export const setBgColor = (data: string) => {
  bgColor.value = data;
};

export const onBgColorChanged = (callback: (data: string) => void) => {
  effect(() => {
    if (bgColor.value) {
      callback(bgColor.value);
    }
  });
};
