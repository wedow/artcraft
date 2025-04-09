import { signal } from "@preact/signals-react";
const buttonTestSignal = signal<{ disabled: boolean; active: boolean }>({
  disabled: false,
  active: false,
});
export const buttonTest = {
  signal: buttonTestSignal,
  disable: () => {
    buttonTestSignal.value = { ...buttonTestSignal.value, disabled: true };
  },
  enable: () => {
    buttonTestSignal.value = {
      ...buttonTestSignal.value,
      disabled: false,
    };
  },
  setActive: () => {
    buttonTestSignal.value = {
      ...buttonTestSignal.value,
      active: true,
    };
  },
  setInactive: () => {
    buttonTestSignal.value = {
      ...buttonTestSignal.value,
      active: false,
    };
  },
};
