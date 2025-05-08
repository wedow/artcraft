import { MouseEventHandler } from "react";
import { signal, effect, Signal } from "@preact/signals-react";

import { ToolbarMainButtonNames } from "../../../components/features/ToolbarMain/enum";
import { AppModes } from "../../../KonvaApp/constants";

const events = Object.values(ToolbarMainButtonNames).reduce(
  (acc, buttonName) => {
    acc[buttonName] = signal<
      React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined
    >();
    return acc;
  },
  {} as {
    [key in ToolbarMainButtonNames]: Signal<
      (React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined) | undefined
    >;
  },
);
const effectsCleanups = Object.values(ToolbarMainButtonNames).reduce(
  (acc, buttonName) => {
    acc[buttonName] = undefined;
    return acc;
  },
  {} as {
    [key in ToolbarMainButtonNames]: (() => void) | undefined;
  },
);

export const isToolbarMode = (buttonName: ToolbarMainButtonNames) => {
  return appModeMap[buttonName] !== undefined;
}

export const appModeMap: Record<string, AppModes> = {
  [ToolbarMainButtonNames.SELECT]: AppModes.SELECT,
  [ToolbarMainButtonNames.ERASER]: AppModes.ERASER,
  [ToolbarMainButtonNames.PAINT]: AppModes.PAINT,
}

const defaultHandler = (buttonName: ToolbarMainButtonNames, callback: MouseEventHandler<HTMLButtonElement>) => {
  if (effectsCleanups[buttonName]) {
    effectsCleanups[buttonName]();
  }
  effectsCleanups[buttonName] = effect(() => {
    if (events[buttonName].value) {
      callback(events[buttonName].value);
      events[buttonName].value = undefined;
    }
  });
}

export const buttonEventsHandlers = Object.values(
  ToolbarMainButtonNames,
).reduce(
  (acc, buttonName) => {
    acc[buttonName] = {
      onClick: (callback: MouseEventHandler<HTMLButtonElement>) => { defaultHandler(buttonName, callback) },
    };
    return acc;
  },
  {} as {
    [key in ToolbarMainButtonNames]: {
      onClick: (callback: MouseEventHandler<HTMLButtonElement>) => void;
    };
  },
);

export const buttonDispatchers = Object.values(ToolbarMainButtonNames).reduce(
  (acc, buttonName) => {
    acc[buttonName] = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      events[buttonName].value = e;
    };
    return acc;
  },
  {} as {
    [key in ToolbarMainButtonNames]: MouseEventHandler<HTMLButtonElement>;
  },
);
