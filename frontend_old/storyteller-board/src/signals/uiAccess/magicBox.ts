import { signal } from "@preact/signals-react";
type MagicBoxSignalType = {
  isShowing: boolean;
  orientation: "vertical" | "horizontal";
  scale: number;
};
const magicBoxSignal = signal<MagicBoxSignalType>({
  isShowing: false,
  orientation: "vertical",
  scale: 1,
});
export const magicBox = {
  signal: magicBoxSignal,
  isShowing: () => {
    return magicBoxSignal.value.isShowing;
  },
  hide: () => {
    magicBoxSignal.value = { ...magicBoxSignal.value, isShowing: false };
  },
  show: () => {
    magicBoxSignal.value = { ...magicBoxSignal.value, isShowing: true };
  },
  setOrientation: (orientation: "vertical" | "horizontal") => {
    magicBoxSignal.value = { ...magicBoxSignal.value, orientation };
  },
  setScale: (scale: number) => {
    magicBoxSignal.value = { ...magicBoxSignal.value, scale };
  },
  update: (updatedVals: Partial<MagicBoxSignalType>) => {
    magicBoxSignal.value = { ...magicBoxSignal.value, ...updatedVals };
  },
};
