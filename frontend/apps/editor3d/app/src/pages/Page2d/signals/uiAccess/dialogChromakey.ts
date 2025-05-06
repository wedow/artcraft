import { signal } from "@preact/signals-react";
import { ChromakeyProps } from "~/components/features/DialogChromakey/type";

const initialState = {
  isShowing: false,
  chromakeyProps: {
    isChromakeyEnabled: false,
  },
};
const dialogChromaSignal = signal<{
  isShowing: boolean;
  chromakeyProps: ChromakeyProps;
}>(initialState);

export const dialogChromakey = {
  signal: dialogChromaSignal,

  show(chromakeyProps: ChromakeyProps) {
    dialogChromaSignal.value = {
      ...dialogChromaSignal.value,
      isShowing: true,
      chromakeyProps,
    };
  },
  hide() {
    dialogChromaSignal.value = initialState;
  },
};
