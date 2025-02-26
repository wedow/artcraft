import { MouseEvent, MouseEventHandler, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { EyeDropper } from "react-eyedrop";
import { Button } from "./Button";
import { faEyedropper } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type ColorPickerHTMLAttributes = Omit<React.HTMLAttributes<HTMLDivElement>, "color" | "onChange" | "onChangeCapture">;
interface ColorPickerBaseProps<T extends string> extends ColorPickerHTMLAttributes {
  color: T;
  onChange: (newColor: T) => void;
}

export const HexEyedropPicker = ({
  color,
  onDropperChange,
  dropperClassName,
  pickerClassName,
  onPickerChange,
  Picker
}: {
  color: string;
  onDropperChange?: (newColor: string) => void;
  dropperClassName?: string;
  pickerClassName?: string;
  onPickerChange: (newColor: string) => void;
  Picker: (props: Partial<ColorPickerBaseProps<string>>) => JSX.Element;
}) => {

  const handleDropperClick = () => {
    if (!('EyeDropper' in window)) {
      // NOTE: This shouldn't happen cuz we're using Chromium
      console.error("EyeDropper not found in window");
      return;
    }

    const startEyeDrop = async (): Promise<string | null> => {
      // @ts-ignore-next-line
      const dropper = new window.EyeDropper();

      try {
        const result = await dropper.open();
        console.log(result);
        return result.sRGBHex;
      } catch (err) {
        // User cancelled the picker
        return null;
      }
    }

    startEyeDrop().then((newColor) => {
      if (newColor) {
        onDropperChange?.(newColor);
      }
    });
  }

  const [isDragging, setIsDragging] = useState(false);
  const handleOnMouseDown = () => {
    setIsDragging(true);
  }
  const handleOnMouseUp = () => {
    setIsDragging(false);
  }

  return (
    <div className={"relative"}>
      <Picker
        className={pickerClassName}
        color={color}
        onChange={onPickerChange}
        onMouseDown={handleOnMouseDown}
        onMouseUp={handleOnMouseUp}
      />
      <Button
        className={twMerge([
          "rounded-full m-1 size-8 text-ui-controls bg-transparent hover:bg-black/70 hover:text-white z-20 shadow-none hover:shadow-xl duration-200",
          dropperClassName,
          "absolute left-0 top-0",
          isDragging ? "opacity-0 -z-10" : ""
        ])}
        icon={faEyedropper}
        onClick={handleDropperClick}
      />
    </div>
  )
}
