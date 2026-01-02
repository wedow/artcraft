import { signal } from "@preact/signals-core";

export const showErrorDialog = signal(false);
export const errorDialogTitle = signal("Error!");
export const errorDialogMessage = signal("Something went wrong.");

export function setErrorDialogTitle(errorTitle: string) {
  errorDialogTitle.value = errorTitle;
}

export function setErrorDialogMessage(errorMessage: string) {
  errorDialogMessage.value = errorMessage;
}
