// import { useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  faCircleMinus,
  faCirclePlus,
  faRotateLeft,
  faRotateRight,
  faScalpel,
} from "@fortawesome/pro-solid-svg-icons";
import {
  LoadingBar,
  LoadingBarStatus,
  LoadingBarProps,
  // Slider,
} from "~/components/ui";
import {
  ToolbarButton,
  ToolbarButtonProps,
} from "~/components/features/ToolbarButton";
import { paperWrapperStyles } from "~/components/styles";
import { ToolbarVideoExtractionButtonNames } from "./enums";
import { Button, Tooltip } from "~/components/ui";

export interface ToolbarVideoExtractionProps {
  extractionMode: "inclusion" | "exclusion";
  readyToSubmit: boolean;
  disabled?: boolean;
  buttonsProps: {
    [key in ToolbarVideoExtractionButtonNames]: ToolbarButtonProps;
  };
  loadingBarProps?: Partial<LoadingBarProps>;
}
export const ToolbarVideoExtraction = ({
  extractionMode = "inclusion",
  readyToSubmit = false,
  disabled,
  buttonsProps,
  loadingBarProps,
}: ToolbarVideoExtractionProps) => {
  // const [frame, setFrame] = useState(0);
  const loadingBar = {
    colReverse: true,
    progress: 0,
    status: LoadingBarStatus.IDLE,
    message: "Select Points for Extraction",
    ...loadingBarProps,
  };
  return (
    <div
      className={twMerge(
        paperWrapperStyles,
        disabled && "pointer-events-none cursor-default bg-ui-border shadow-md",
        "flex flex-col items-center justify-center gap-2 pr-4 transition",
      )}
    >
      <div className="w-full p-2">
        <LoadingBar {...loadingBar} />
        {/* <Slider
          min={0}
          max={100}
          onChange={(val) => {
            console.log(val);
          }}
          step={1}
          value={frame}
        /> */}
      </div>
      <div className="flex w-full items-center justify-center gap-2">
        <Tooltip
          tip={
            extractionMode === "inclusion"
              ? "Using Inclusion Points"
              : "Use Inclusion Points"
          }
        >
          <div>
            <ToolbarButton
              icon={faCirclePlus}
              buttonProps={{
                ...buttonsProps.INCLUSION_MODE,
                active: extractionMode === "inclusion",
              }}
            />
          </div>
        </Tooltip>
        <Tooltip
          tip={
            extractionMode === "exclusion"
              ? "Using Exclusion Points"
              : "Use Exclusion Points"
          }
        >
          <div>
            <ToolbarButton
              icon={faCircleMinus}
              buttonProps={{
                ...buttonsProps.EXCLUSION_MODE,
                active: extractionMode === "exclusion",
              }}
            />
          </div>
        </Tooltip>
        <ToolbarButton
          icon={faRotateLeft}
          tooltip="Undo"
          buttonProps={buttonsProps.UNDO}
        />
        <ToolbarButton
          icon={faRotateRight}
          tooltip="Redo"
          buttonProps={buttonsProps.REDO}
        />
        <DoneButton {...buttonsProps.DONE} ready={readyToSubmit} />
        <CancelButton {...buttonsProps.CANCEL} />
      </div>
    </div>
  );
};
const CancelButton = (buttonProps: ToolbarButtonProps) => {
  const {
    className: customButtonClassNames,
    disabled,
    active,
    hidden,
    onClick,
    ...restButtonProps
  } = buttonProps;

  return (
    <Button
      className="text-nowrap"
      variant="secondary"
      disabled={disabled}
      {...restButtonProps}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) {
          onClick(e);
        }
      }}
      {...restButtonProps}
    >
      Cancel
    </Button>
  );
};
type DoneButtonProps = { ready: boolean } & ToolbarButtonProps;
const DoneButton = ({ ready, ...buttonProps }: DoneButtonProps) => {
  const {
    className: customButtonClassNames,
    disabled,
    active,
    hidden,
    onClick,
    ...restButtonProps
  } = buttonProps;

  return (
    <Tooltip tip="Click to Complete Extraction">
      <Button
        className="text-nowrap"
        icon={faScalpel}
        disabled={disabled || !ready}
        {...restButtonProps}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onClick) {
            onClick(e);
          }
        }}
        {...restButtonProps}
      >
        Done
      </Button>
    </Tooltip>
  );
};
