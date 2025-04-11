import { MouseEventHandler } from "react";
import { signal, effect } from "@preact/signals-react";

const event = signal<
  React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined
>(undefined);

let effectCleanup: (() => void) | undefined = undefined;

export const eventsHandler = {
  onClick: (callback: MouseEventHandler<HTMLButtonElement>) => {
    if (effectCleanup) {
      effectCleanup();
    }
    effectCleanup = effect(() => {
      if (event.value) {
        callback(event.value);
        event.value = undefined;
      }
    });
  },
};

export const dispatcher = {
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    console.log("Button Retry dispatcher");
    event.value = e;
  },
};
