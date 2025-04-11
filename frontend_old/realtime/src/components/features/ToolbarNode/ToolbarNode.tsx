import {twMerge} from "tailwind-merge";

import {faPalette,} from "@fortawesome/pro-solid-svg-icons";
import {ToolbarButton, ToolbarButtonProps,} from "~/components/features/ToolbarButton";
import {paperWrapperStyles} from "~/components/styles";
import {ToolbarNodeButtonNames} from "./enums";
import {ToolbarNodeButtonData} from "./data";
import {ColorPicker} from "~/components/ui/TextEditor/ColorPicker";
import {DEFAULT_PAINT_COLOR} from "~/signals/uiEvents/toolbarMain/paintMode";

export interface ToolbarNodeProps {
  disabled?: boolean;
  locked: boolean | "unknown";
  onLockClicked: (
    e: React.MouseEvent<HTMLButtonElement>,
    currLock: boolean,
  ) => void;
  lockDisabled?: boolean;
  buttonsProps?: {
    [key in ToolbarNodeButtonNames]: ToolbarButtonProps;
  };
  color?: string;
  onColorChange?: (color: string) => void;
}
export const ToolbarNode = ({
  disabled,
  locked,
  lockDisabled,
  onLockClicked,
  buttonsProps,
  color = DEFAULT_PAINT_COLOR,
  onColorChange = () => { },
}: ToolbarNodeProps) => {
  return (
    <div
      className={twMerge(
        paperWrapperStyles,
        disabled && "pointer-events-none cursor-default bg-ui-border shadow-md",
        "flex flex-col gap-1 transition",
      )}
    >
      {ToolbarNodeButtonData.map((buttonDatum, idx) => {
        const buttonProps = buttonsProps?.[buttonDatum.name];

        if (!buttonProps || buttonProps.hidden) {
          return;
        }

        if (buttonDatum.name !== ToolbarNodeButtonNames.COLOR) {
          return (
            <ToolbarButton
              icon={buttonDatum.icon}
              key={idx}
              buttonProps={{ ...buttonProps, className: "w-full p-2" }}
            >
              <span className="text-[16px]">{buttonDatum.tooltip}</span>
            </ToolbarButton>

          );
        } else {
          return (
            <ColorPicker color={color} onChange={onColorChange} faIcon={faPalette} borderStyle="w-full justify-start h-auto gap-2.5 text-white/80" showBar={false} key={idx}>
              <span className="text-[16px]">{buttonDatum.tooltip}</span>
            </ColorPicker>
          )
        }
      })}
    </div>
  );
};
