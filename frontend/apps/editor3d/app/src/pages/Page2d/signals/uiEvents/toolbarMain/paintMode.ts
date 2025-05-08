import { effect, signal } from "@preact/signals-react";
import { clamp, normalize } from "../../../utilities";

export const DEFAULT_PAINT_COLOR: string = "#ff0000";
export const paintColor = signal<string>(DEFAULT_PAINT_COLOR);
export const setPaintColor = (data: string) => {
  paintColor.value = data;
};

export const BRUSH_MIN_SIZE: number = 0;
export const BRUSH_MAX_SIZE: number = 100;
// NOTE: Must be between MIN and MAX sizes - there's no runtime checks
export const DEFAULT_PAINT_BRUSH_SIZE: number = 50;
export const paintBrushSize = signal<number>(DEFAULT_PAINT_BRUSH_SIZE);
export const setPaintBrushSize = (brushSize: number) => {
  paintBrushSize.value = clamp(brushSize, BRUSH_MIN_SIZE, BRUSH_MAX_SIZE);
  console.debug(`Paint brush size set to ${paintBrushSize.value}`);
}

export const onPaintColorChanged = (callback: (data: string) => void) => {
  effect(() => {
    if (paintColor.value) {
      callback(paintColor.value);
    }
  });
};

export const onPaintBrushSizeChanged = (callback: (normalizedSize: number) => void) => {
  effect(() => {
    callback(normalize(paintBrushSize.value, BRUSH_MIN_SIZE, BRUSH_MAX_SIZE));
  });
};
