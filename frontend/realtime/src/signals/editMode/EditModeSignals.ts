import { effect, signal } from "@preact/signals-react";
import { clamp, normalize } from "~/utilities";

export enum EditMode {
  INIT = "INIT",
  SELECT = "SELECT",
  EDIT = "EDIT",
}

export const EDIT_MIN_BRUSH_SIZE = 10;
export const EDIT_MAX_BRUSH_SIZE = 100;
export const EDIT_INIT_BRUSH_SIZE = 50;
export const editModePrompt = signal("");
export const editModeState = signal<EditMode>(EditMode.SELECT);
export const editModeBrushSize = signal(EDIT_INIT_BRUSH_SIZE);
export const editModeClearSignal = signal(false); // Just a signal to trigger a clear, value doesn't matter

export const onEditModeChange = (callback: (mode: EditMode) => void) => {
  effect(() => {
    callback(editModeState.value);
  });
};

export const editModeBaseImage = signal<File | null>(null);

export const onEditModeBaseImageChange = (callback: (file: File) => void) => {
  effect(() => {
    if (editModeBaseImage.value) {
      callback(editModeBaseImage.value)
      editModeState.value = EditMode.SELECT;
    }
  });
};

export const setEditModeBaseImage = (imageFile: File) => {
  editModeBaseImage.value = imageFile;
}

export const setEditModeBrushSize = (size: number) => {
  editModeBrushSize.value = clamp(size, EDIT_MIN_BRUSH_SIZE, EDIT_MAX_BRUSH_SIZE);
}

export const onEditModeBrushSizeChange = (callback: (size: number) => void) => {
  effect(() => {
    callback(normalize(editModeBrushSize.value, 0, EDIT_MAX_BRUSH_SIZE));
  });
}

export const triggerEditModeClear = () => {
  console.log("trigger called!!!")
  editModeClearSignal.value = !editModeClearSignal.value;
}

export const onEditModeInpaintClear = (callback: (_: boolean) => void) => {
  effect(() => {
    console.log("effect called!!!")
    callback(editModeClearSignal.value);
  });
};
