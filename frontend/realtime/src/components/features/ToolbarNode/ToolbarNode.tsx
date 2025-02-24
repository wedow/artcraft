import { twMerge } from "tailwind-merge";

import {
  faLockKeyholeOpen,
  faLockKeyhole,
  faUnlockKeyhole,
  faPalette,
} from "@fortawesome/pro-solid-svg-icons";
import {
  ToolbarButton,
  ToolbarButtonProps,
} from "~/components/features/ToolbarButton";
import { paperWrapperStyles, toolTipStyles } from "~/components/styles";
import { ToolbarNodeButtonNames } from "./enums";
import { ToolbarNodeButtonData } from "./data";
import { ColorPicker } from "~/components/ui/TextEditor/ColorPicker";

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
  color = "#000000",
  onColorChange = () => { },
}: ToolbarNodeProps) => {
  const handleOnLockClicked: React.MouseEventHandler<HTMLButtonElement> = (
    e,
  ) => {
    if (onLockClicked && locked !== "unknown") {
      onLockClicked(e, locked ?? false);
    }
  };
  const lockDisabledOrUnknown = lockDisabled || locked === "unknown";
  return (
    <div
      className={twMerge(
        paperWrapperStyles,
        disabled && "pointer-events-none cursor-default bg-ui-border shadow-md",
        "flex flex-col gap-2 transition",
      )}
    >
      <ToolbarButton
        buttonProps={{
          className: twMerge(
            locked && "text-primary hover:bg-primary hover:text-white",
            lockDisabledOrUnknown &&
            "text-secondary-300 hover:text-secondary-300",
          ),
          disabled: lockDisabledOrUnknown,
        }}
        tooltip={
          locked === "unknown" ? "Unavailable" : locked ? "Unlock" : "Lock"
        }
        icon={
          locked === "unknown"
            ? faUnlockKeyhole
            : locked
              ? faLockKeyhole
              : faLockKeyholeOpen
        }
        onClick={handleOnLockClicked}
      />
      <span className="border-r border-r-ui-border" />
      {ToolbarNodeButtonData.map((buttonDatum, idx) => {
        const buttonProps = buttonsProps?.[buttonDatum.name];

        if (!buttonProps || buttonProps.hidden) {
          return;
        }

        if (buttonDatum.name !== ToolbarNodeButtonNames.COLOR) {
          return (
            <ToolbarButton
              icon={buttonDatum.icon}
              tooltip={buttonDatum.tooltip}
              key={idx}
              buttonProps={buttonProps}
            />
          );
        } else {
          return (
            <ColorPicker color={color} onChange={onColorChange} faIcon={faPalette} borderStyle="" key={idx} />
          )
        }
      })}
    </div>
  );
};
