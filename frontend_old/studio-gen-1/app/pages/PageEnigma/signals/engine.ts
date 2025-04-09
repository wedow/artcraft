import { signal } from "@preact/signals-core";
import { CameraAspectRatio, EditorStates } from "~/pages/PageEnigma/enums";

export const editorState = signal<EditorStates>(EditorStates.EDIT);

export const cameraAspectRatio = signal<CameraAspectRatio>(
  CameraAspectRatio.HORIZONTAL_16_9,
);

export const setCameraAspectRatio = (newAspectRatio: CameraAspectRatio) => {
  cameraAspectRatio.value = newAspectRatio;
};
export const previewSrc = signal("");
