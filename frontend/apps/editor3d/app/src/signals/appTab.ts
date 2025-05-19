import { signal } from "@preact/signals-react";

// change starting tab
export const appTabId = signal("VIDEO");

export const setAppTabId = (newId: string) => {
  if (newId != "2D" && newId != "3D" && newId != "VIDEO") {
    console.error("Provided app ID is not valid");
    return;
  }

  appTabId.value = newId;
};

export const is3DEditorInitialized = signal(false);
export const setIs3DEditorInitialized = (isInitialized: boolean) => {
  is3DEditorInitialized.value = isInitialized;
};
