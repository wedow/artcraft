import { signal } from "@preact/signals-react";
import { ContextualButtonRetryProps } from "./type";
const buttonRetrySignal = signal<ContextualButtonRetryProps>({
  position: {
    x: 0,
    y: 0,
  },
  isShowing: false,
  disabled: false,
});

export const buttonRetry = {
  signal: buttonRetrySignal,
  disable: () => {
    buttonRetrySignal.value = { ...buttonRetrySignal.value, disabled: true };
  },
  updatePosition(position: { x: number; y: number }) {
    buttonRetrySignal.value = {
      ...buttonRetrySignal.value,
      position,
    };
  },
  enable: () => {
    buttonRetrySignal.value = {
      ...buttonRetrySignal.value,
      disabled: false,
    };
  },
  show(props: Omit<ContextualButtonRetryProps, "isShowing">) {
    if (buttonRetrySignal.value.isShowing) {
      if (import.meta.env.DEV) {
        console.warn(
          "Loading bar is already showing",
          "use the `updatePosition` methods instead",
        );
      }
      return;
    }
    buttonRetrySignal.value = {
      ...props,
      isShowing: true,
    };
  },
  hide() {
    buttonRetrySignal.value = {
      ...buttonRetrySignal.value,
      isShowing: false,
    };
  },
};
