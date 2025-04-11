import { MouseEventHandler } from "react";
import { signal, effect } from "@preact/signals-react";

const loadingBarRetryEvent = signal<
  React.MouseEvent<HTMLButtonElement> | undefined
>();

let loadingBarRetryEffectCleanup: (() => void) | undefined = undefined;
export const loadingBarRetryEventHandler = {
  onClick: (callback: MouseEventHandler<HTMLButtonElement>) => {
    if (loadingBarRetryEffectCleanup) {
      loadingBarRetryEffectCleanup();
    }
    loadingBarRetryEffectCleanup = effect(() => {
      if (loadingBarRetryEvent.value) {
        callback(loadingBarRetryEvent.value);
        loadingBarRetryEvent.value = undefined;
      }
    });
  },
};

export const loadingBarRetryDispatch = (
  e: React.MouseEvent<HTMLButtonElement>,
) => {
  console.log("toolbarMain > loadingBar > retry : onClick dispatched", e);
  loadingBarRetryEvent.value = e;
};
