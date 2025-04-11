import { signal } from "@preact/signals-react";
import { ToolbarMainButtonNames } from "~/components/features/ToolbarMain/enum";

interface ToolbarMainSignalInterface {
  disabled: boolean;
  buttonStates: {
    [key in ToolbarMainButtonNames]: { disabled: boolean; active: boolean };
  };
}
const toolbarMainSignal = signal<ToolbarMainSignalInterface>({
  disabled: false,
  buttonStates: initButtonStates(),
});

export const toolbarMain = {
  signal: toolbarMainSignal,
  enable() {
    toolbarMainSignal.value = {
      ...toolbarMainSignal.value,
      disabled: false,
    };
  },
  disable() {
    toolbarMainSignal.value = {
      ...toolbarMainSignal.value,
      disabled: true,
    };
  },

  changeButtonState(
    buttonName: ToolbarMainButtonNames,
    { disabled, active }: { disabled?: boolean; active?: boolean },
  ) {
    toolbarMainSignal.value = {
      ...toolbarMainSignal.value,
      buttonStates: {
        ...toolbarMainSignal.value.buttonStates,
        [buttonName]: {
          disabled: active ? false : (disabled ?? false),
          active: active ?? false,
        },
      },
    };
  },
};

function initButtonStates() {
  const ret: { [key: string]: { disabled: boolean; active: boolean } } = {};
  Object.values(ToolbarMainButtonNames).forEach((buttonName) => {
    ret[buttonName] = {
      disabled: false,
      active: false,
    };
  });
  return ret as ToolbarMainSignalInterface["buttonStates"];
}
