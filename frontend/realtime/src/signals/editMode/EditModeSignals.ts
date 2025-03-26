import { effect, signal } from "@preact/signals-react";

export enum EditMode {
  INIT = "INIT",
  SELECT = "SELECT",
  EDIT = "EDIT",
}

export const editModePrompt = signal("");
export const editModeState = signal<EditMode>(EditMode.SELECT);

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
