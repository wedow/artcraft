import { faPlusCircle, faMinusCircle, faDrawCircle, faEraser, faPaintbrush } from "@fortawesome/pro-regular-svg-icons";
import { EditOperation } from "./stores/EditState";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { faPaintBrush } from "@fortawesome/pro-solid-svg-icons";

export interface DrawToolControlBarProps {
  currentMode: EditOperation;
  currentSize: number;
  onModeChange?: (mode: EditOperation) => void;
  onSizeChange?: (size: number) => void;
}

const DrawToolControlBar = ({
  currentMode,
  currentSize,
  onModeChange,
  onSizeChange = () => { }
}: DrawToolControlBarProps) => {

  const modes = [
    {
      value: "add",
      icon: faPaintBrush,
      text: "Draw",
      tooltip: "Draw strokes",
    },
    {
      value: "minus",
      icon: faEraser,
      text: "Erase",
      tooltip: "Erases strokes",
    },
  ];

  return (
    <div className="absolute top-16 left-1/2 flex -translate-x-1/2 flex-col gap-3">
      <div className="glass w-[400px] flex gap-2 rounded-xl p-2 items-center">
        <ButtonIconSelect
          options={modes}
          // @ts-expect-error - TypeScript doesn't recognize the value as EditOperation
          onOptionChange={onModeChange}
          selectedOption={currentMode}
        />
        <SliderV2 min={1} max={50} value={currentSize} onChange={onSizeChange} step={1} innerLabel={"Size  " + currentSize + "pt"} showDecrement showIncrement />
      </div>
    </div>
  )
}

export default DrawToolControlBar;
