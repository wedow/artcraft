import { signal } from "@preact/signals-react";

const initialState = {
  isShowing: false,
  title: "",
  message: "",
};
const dialogErrorSignal = signal(initialState);

export const dialogError = {
  signal: dialogErrorSignal,

  show({ title, message }: { title?: string; message?: string }) {
    dialogErrorSignal.value = {
      ...dialogErrorSignal.value,
      title: title ?? "Error",
      message: message ?? "An unknownerror occurred",
      isShowing: true,
    };
  },
  hide() {
    dialogErrorSignal.value = initialState;
  },
};
