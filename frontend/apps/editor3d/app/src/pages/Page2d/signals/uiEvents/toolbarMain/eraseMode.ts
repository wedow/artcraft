import { effect, signal } from "@preact/signals-react";
import { clamp, normalize } from "../../../utilities";
import { BRUSH_MAX_SIZE, BRUSH_MIN_SIZE, DEFAULT_PAINT_BRUSH_SIZE, paintBrushSize } from "./paintMode";

export const eraseBrushSize = signal<number>(DEFAULT_PAINT_BRUSH_SIZE);
export const setEraseBrushSize = (brushSize: number) => {
  eraseBrushSize.value = clamp(brushSize, BRUSH_MIN_SIZE, BRUSH_MAX_SIZE);
}

export const onEraseBrushSizeChanged = (callback: (normalizedSize: number) => void) => {
  effect(() => {
    callback(normalize(paintBrushSize.value, BRUSH_MIN_SIZE, BRUSH_MAX_SIZE));
  });
};
