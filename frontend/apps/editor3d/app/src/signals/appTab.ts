import { signal } from "@preact/signals-react";
import { STARTING_APP_TAB_ID } from "~/components/signaled/TopBar/TopBar";

// change starting tab
export const appTabId = signal(STARTING_APP_TAB_ID);

export const setAppTabId = (newId: string) => {
  switch (newId) {
    case "2D":
    case "3D":
    case "IMAGE":
    case "VIDEO":
      break;
    default:
      console.error("Provided app ID is not valid");
      return;
  }

  appTabId.value = newId;
};

export const is3DEditorInitialized = signal(false);
export const setIs3DEditorInitialized = (isInitialized: boolean) => {
  is3DEditorInitialized.value = isInitialized;
};

export const is3DPageMounted = signal(false);
export const set3DPageMounted = (isMounted: boolean) => {
  is3DPageMounted.value = isMounted;
}
