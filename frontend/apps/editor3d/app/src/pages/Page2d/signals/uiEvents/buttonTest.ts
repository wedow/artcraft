// import { MouseEventHandler } from "react";
import { signal, effect } from "@preact/signals-react";

const event = signal<number | undefined>();

export const eventsHandler = {
  onClick: (callback: () => void) => {
    effect(() => {
      if (event.value) {
        console.log("Button Test effect event handler", event.value);
        callback();
        return () => {
          console.log("Button Test effect event handler cleanup");
          event.value = undefined;
        };
      }
    });
  },
};

export const dispatcher = {
  onClick: () => {
    console.log("Button Test dispatcher");
    event.value = new Date().getTime();
  },
};
