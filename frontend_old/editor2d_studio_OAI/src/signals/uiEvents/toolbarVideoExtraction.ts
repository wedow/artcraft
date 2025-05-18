import { MouseEventHandler } from "react";
import { signal, effect, Signal } from "@preact/signals-react";

import { ToolbarVideoExtractionButtonNames as ButtonNames } from "~/components/features/ToolbarVideoExtraction/enums";

const buttonEventsRecords = Object.values(ButtonNames).reduce(
  (acc, buttonName) => {
    acc[buttonName] = {
      eventSignal: signal<
        React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined
      >(),
      effectCleanup: undefined,
      lastEventTimestamp: undefined,
    };
    return acc;
  },
  {} as {
    [key in ButtonNames]: {
      eventSignal: Signal<
        | (React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined)
        | undefined
      >;
      effectCleanup: (() => void) | undefined;
      lastEventTimestamp: number | undefined;
    };
  },
);

const buttonEventsHandlers = Object.values(ButtonNames).reduce(
  (acc, buttonName) => {
    acc[buttonName] = {
      onClick: (callback: MouseEventHandler<HTMLButtonElement>) => {
        const { eventSignal, effectCleanup, lastEventTimestamp } =
          buttonEventsRecords[buttonName];
        if (effectCleanup !== undefined) {
          // this clears the effect listener to rebind a new one for the onClick
          effectCleanup();
        }
        buttonEventsRecords[buttonName].effectCleanup = effect(() => {
          if (
            eventSignal.value &&
            lastEventTimestamp !== eventSignal.value.timeStamp
          ) {
            buttonEventsRecords[buttonName].lastEventTimestamp =
              eventSignal.value.timeStamp;
            // console.log(buttonName, "EFFECT is triggered");
            callback(eventSignal.value);
            buttonEventsRecords[buttonName].eventSignal.value = undefined;
          }
        });
      },
    };
    return acc;
  },
  {} as {
    [key in ButtonNames]: {
      onClick: (callback: MouseEventHandler<HTMLButtonElement>) => void;
    };
  },
);

const buttonDispatchers = Object.values(ButtonNames).reduce(
  (acc, buttonName) => {
    acc[buttonName] = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      // console.log(buttonName + " DISPATCHED", e);
      buttonEventsRecords[buttonName].eventSignal.value = e;
    };
    return acc;
  },
  {} as {
    [key in ButtonNames]: MouseEventHandler<HTMLButtonElement>;
  },
);

export const dispatchers = {
  ...buttonDispatchers,
};
export const eventsHandlers = {
  ...buttonEventsHandlers,
};
