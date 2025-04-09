import { signal, effect } from "@preact/signals-react";
import { ChromakeyProps } from "~/components/features/DialogChromakey/type";
const chromakeyRequest = signal<ChromakeyProps>();

export const dispatchChromakeyRequest = (newProps: ChromakeyProps) => {
  chromakeyRequest.value = newProps;
};
export const onChromakeyRequest = (
  callback: (props: ChromakeyProps) => void,
) => {
  effect(() => {
    if (chromakeyRequest.value) {
      callback(chromakeyRequest.value);
    }
  });
};
