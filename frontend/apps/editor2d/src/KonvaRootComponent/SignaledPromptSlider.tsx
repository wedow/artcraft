import { useSignalEffect } from "@preact/signals-react";
import { Slider } from "~/components/ui";
import { dispatchUiEvents } from "~/signals";
import { promptStrength } from "~/signals/uiEvents/promptSettings";

export const SignaledPromptSlider = () => {
  const sliderValue = promptStrength.value;
  const onSliderValueChanged =
    dispatchUiEvents.promptSettings.setPromptStrength;

  // This makes component re-render whenever the signal value changes
  useSignalEffect(() => {
    promptStrength.value;
  });

  return (
    <div className="fixed bottom-[138px] left-1/2 h-4 w-[400px] -translate-x-1/2 shadow-lg">
      <Slider
        min={0}
        max={100}
        value={sliderValue}
        onChange={onSliderValueChanged}
        step={1}
        innerLabel={`Strength - ${sliderValue}%`}
      />
    </div>
  );
};
