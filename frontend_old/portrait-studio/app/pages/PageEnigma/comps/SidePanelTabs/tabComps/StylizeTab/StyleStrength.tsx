import { Label, NumberInput, Slider } from "~/components";
import { useSignals } from "@preact/signals-react/runtime";

import { styleStrength } from "~/pages/PageEnigma/signals/stylizeTab";

export function StyleStrength() {
  useSignals();

  const sliderChanged = (value: number | number[]) => {
    styleStrength.value = (value as number) / 100;
  };

  const handleNumberInputChange = (value: number) => {
    styleStrength.value = value / 100;
  };

  return (
    <div className="mt-3 flex w-full flex-col justify-center gap-4 rounded-b-lg bg-ui-panel">
      <div className="w-full">
        <div>
          <Label>
            <div className="mb-1 leading-tight">Style Strength (%)</div>
          </Label>
          <div className="mb-4 text-xs text-white/70">
            (The higher the value the more the style will be applied, the lower
            the value the closer to source.)
          </div>

          <div className="mb-2 flex items-center gap-3.5">
            <NumberInput
              value={styleStrength.value * 100}
              onChange={handleNumberInputChange}
            />
            <Slider
              value={styleStrength.value * 100}
              min={0}
              max={100}
              step={1}
              onChange={sliderChanged}
              showTooltip={true}
              suffix="%"
              className="mr-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
