import { MouseEventHandler } from "react";
import { signal, effect, Signal } from "@preact/signals-react";

import { ToolbarNodeButtonNames as ButtonNames } from "~/components/features/ToolbarNode/enums";
const lockEvent = signal<React.MouseEvent<HTMLButtonElement> | undefined>();
let lockEffectCleanup: (() => void) | undefined;
const lockEventHandler = (callback: MouseEventHandler<HTMLButtonElement>) => {
  if (lockEffectCleanup) {
    lockEffectCleanup();
  }
  lockEffectCleanup = effect(() => {
    if (lockEvent.value) {
      callback(lockEvent.value);
      lockEvent.value = undefined;
    }
  });
};
const lockDispatcher = (e: React.MouseEvent<HTMLButtonElement>) => {
  lockEvent.value = e;
};

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
    // We define custom events/handlers for color changes
    if (buttonName === ButtonNames.COLOR) {
      return acc;
    }

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

const retryEvent = signal<React.MouseEvent<HTMLButtonElement> | undefined>();
let lastRetryEventTimeStamp: number | undefined = undefined;
let retryEffectCleanup: (() => void) | undefined;
const retryEventHandler = (callback: MouseEventHandler<HTMLButtonElement>) => {
  if (retryEffectCleanup) {
    retryEffectCleanup();
  }
  retryEffectCleanup = effect(() => {
    if (retryEvent.value) {
      if (
        lastRetryEventTimeStamp === undefined ||
        lastRetryEventTimeStamp !== retryEvent.value.timeStamp
      ) {
        lastRetryEventTimeStamp = retryEvent.value.timeStamp;
        callback(retryEvent.value);
      }
    }
  });
};

const retryDispatcher = (e: React.MouseEvent<HTMLButtonElement>) => {
  retryEvent.value = e;
};

export type NodeColor = {
  kNodeId: string;
  color: string;
}
const selectedColorEvent = signal<NodeColor | null>();
const setSelectedColor = (nodeColor: NodeColor) => {
  selectedColorEvent.value = nodeColor;
}
const onSelectedColorChanged = (callback: (color: NodeColor) => void) => {
  effect(() => {
    if (selectedColorEvent.value) {
      callback(selectedColorEvent.value);
    }
  });
};

export const dispatchers = {
  lock: lockDispatcher,
  retry: retryDispatcher,
  setSelectedColor,
  ...buttonDispatchers,
};
export const eventsHandlers = {
  lock: {
    onClick: lockEventHandler,
  },
  retry: {
    onClick: retryEventHandler,
  },
  color: {
    onConfirmChanged: onSelectedColorChanged,
  },
  ...buttonEventsHandlers,
};
