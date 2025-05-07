import { signal } from "@preact/signals-react";
import { ContextualLoadingBarProps } from "./type";
import { LoadingBarStatus } from "~/components/ui/LoadingBar";

const loadingBarSignal = signal<ContextualLoadingBarProps>({
  position: {
    x: 0,
    y: 0,
  },
  width: 300,
  isShowing: false,
  progress: 0,
  status: LoadingBarStatus.IDLE,
  message: undefined,
  onRetry: undefined,
});

export const loadingBar = {
  signal: loadingBarSignal,
  isShowing() {
    return loadingBarSignal.value.isShowing;
  },
  update(props: Partial<Omit<ContextualLoadingBarProps, "isShowing">>) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      // isShowing: true,
      ...props,
    };
  },
  updateMessage(message: string) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      message,
    };
  },
  updateWidth(width: number) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      width,
    };
  },
  updatePosition(position: { x: number; y: number }) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      position,
    };
  },
  updateProgress(progress: number) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      progress,
    };
  },
  updateStatus(status: LoadingBarStatus) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      status,
    };
  },
  show(props?: Partial<Omit<ContextualLoadingBarProps, "isShowing">>) {
    if (loadingBarSignal.value.isShowing) {
      if (import.meta.env.DEV) {
        console.warn(
          "Loading bar is already showing",
          "use the `update` methods instead",
        );
      }
      return;
    }
    const mergedProps = props
      ? { ...props, ...loadingBarSignal.value }
      : loadingBarSignal.value;
    loadingBarSignal.value = {
      ...mergedProps,
      isShowing: true,
    };
  },
  hide() {
    if (loadingBarSignal.value.isShowing !== false) {
      loadingBarSignal.value = {
        ...loadingBarSignal.value,
        isShowing: false,
      };
    }
  },
};
