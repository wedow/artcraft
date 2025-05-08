import { Button } from "./Button";
import { faEyedropper } from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type ColorPickerHTMLAttributes = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "color" | "onChange" | "onChangeCapture"
>;
interface ColorPickerBaseProps<T extends string>
  extends ColorPickerHTMLAttributes {
  color: T;
  onChange: (newColor: T) => void;
}

export const HexEyedropPicker = ({
  color,
  onDropperChange,
  dropperClassName,
  pickerClassName,
  onPickerChange,
  Picker,
}: {
  color: string;
  onDropperChange?: (newColor: string) => void;
  dropperClassName?: string;
  pickerClassName?: string;
  onPickerChange: (newColor: string) => void;
  Picker: (props: Partial<ColorPickerBaseProps<string>>) => JSX.Element;
}) => {
  const handleDropperClick = () => {
    if (!("EyeDropper" in window)) {
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
    };

    startEyeDrop().then((newColor) => {
      if (newColor) {
        onDropperChange?.(newColor);
      }
    });
  };

  // const [isDragging, setIsDragging] = useState(false);
  // const handleOnMouseDown = () => {
  //   setIsDragging(true);
  // };
  // const handleOnMouseUp = () => {
  //   setIsDragging(false);
  // };

  return (
    <div className={"relative"}>
      <Button
        className={twMerge([
          "z-20 size-8 rounded-xl bg-ui-background/30 text-white shadow-none duration-200 hover:bg-white/10 hover:text-white hover:shadow-xl",
          dropperClassName,
        ])}
        icon={faEyedropper}
        onClick={handleDropperClick}
      />
      <Picker
        className={pickerClassName}
        color={color}
        onChange={onPickerChange}
        // onMouseDown={handleOnMouseDown}
        // onMouseUp={handleOnMouseUp}
      />
    </div>
  );
};
