import { signal } from "@preact/signals-react";
import { LoadingBarStatus } from "~/components/ui";
import { LoadingBarInterface } from "../type";

const loadingBarSignal = signal<LoadingBarInterface>({
  isShowing: false,
  progress: 0,
  status: LoadingBarStatus.IDLE,
  message: undefined,
});

export const loadingBar = {
  signal: loadingBarSignal,
  update: (props: Partial<LoadingBarInterface>) => {
    loadingBarSignal.value = { ...loadingBarSignal.value, ...props };
  },
  updateMessage(message: string | undefined) {
    loadingBarSignal.value = {
      ...loadingBarSignal.value,
      message,
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
  show: (props?: Omit<LoadingBarInterface, "isShowing">) => {
    const mergedProps = props
      ? { ...props, ...loadingBarSignal.value }
      : loadingBarSignal.value;
    loadingBarSignal.value = {
      ...mergedProps,
      isShowing: true,
    };
  },
  hide: () => {
    loadingBarSignal.value = { ...loadingBarSignal.value, isShowing: false };
  },
};
