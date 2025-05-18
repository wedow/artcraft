import { InputNumber, Slider } from "~/components/ui";
import { AIStylizeProps } from "../utilities";

export function StyleStrengthSlider({
  styleStrength,
  onStylizeOptionsChanged,
}: {
  styleStrength: number;
  onStylizeOptionsChanged: (newOptions: Partial<AIStylizeProps>) => void;
}) {
  const onChanged = (value: number | number[]) => {
    onStylizeOptionsChanged({
      styleStrength: (value as number) / 100,
    });
  };

  return (
    <div className="flex w-full flex-col rounded-b-lg bg-ui-panel">
      <label className="font-bold leading-tight">
        Set the Style Strength (%)
      </label>
      <p className="mt-1 text-xs">
        (The higher the value the more the style will be applied, the lower the
        value the closer to source.)
      </p>
      <div className="mt-3 flex items-center gap-3.5">
        <InputNumber value={styleStrength * 100} onChange={onChanged} />
        <Slider
          value={styleStrength * 100}
          min={0}
          max={100}
          step={1}
          onChange={onChanged}
          showTooltip={true}
          suffix="%"
        />
      </div>
    </div>
  );
}
