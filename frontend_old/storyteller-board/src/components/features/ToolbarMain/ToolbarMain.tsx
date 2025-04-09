import { Fragment, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faFilePlus,
  faFilm,
  faFloppyDisk,
  faImage,
  faLocationArrow,
  faMagicWandSparkles,
  faText,
} from "@fortawesome/pro-solid-svg-icons";

import { ToolbarButton } from "../ToolbarButton";

// style and constants
import { paperWrapperStyles, toolTipStyles } from "~/components/styles";
import { ToolbarMainButtonNames } from "./enum";
import { ButtonPreviewAndRender } from "./ButtonPreviewAndRender";

export const ToolbarMain = ({
  disabled = false,
  buttonProps,
}: {
  disabled?: boolean;
  buttonProps: {
    [key in ToolbarMainButtonNames]: {
      disabled?: boolean;
      active?: boolean;
      onClick?: MouseEventHandler<HTMLButtonElement>;
    };
  };
}) => {
  return (
    <>
      <div
        className={twMerge(
          "flex w-fit items-center divide-x divide-ui-border",
          paperWrapperStyles,
          disabled &&
            "pointer-events-none cursor-default bg-ui-border shadow-md",
        )}
      >
        <div className="flex items-center gap-2 pr-2">
          <ToolbarButton
            icon={faLocationArrow}
            iconProps={{ className: "fa-flip-horizontal" }}
            buttonProps={buttonProps.SELECT}
            tooltip="Select"
          />
          <ToolbarButton
            icon={faText}
            buttonProps={buttonProps.ADD_TEXT}
            tooltip="Add Text"
          />
          <Popover className="relative">
            <PopoverButton as={Fragment}>
              <button
                data-tooltip="Add..."
                className={twMerge(
                  "size-10 rounded-lg p-2 hover:bg-gray-200/50",
                  toolTipStyles,
                )}
              >
                <FontAwesomeIcon icon={faFilePlus} />
              </button>
            </PopoverButton>
            <PopoverPanel
              anchor="bottom"
              className={twMerge(
                // "absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2",
                "flex flex-col [--anchor-gap:16px]",
                paperWrapperStyles,
              )}
            >
              <ToolbarButton icon={faImage} buttonProps={buttonProps.ADD_IMAGE}>
                Add Image
              </ToolbarButton>
            </PopoverPanel>
          </Popover>
          <ToolbarButton
            icon={faMagicWandSparkles}
            buttonProps={{
              ...buttonProps.AI_STYLIZE,
              prominent: true,
            }}
            tooltip="AI Stylize"
          />
        </div>
        <div className="flex items-center gap-2 pl-2">
          <ToolbarButton
            icon={faArrowRotateLeft}
            buttonProps={buttonProps.UNDO}
            tooltip="Undo"
          />
          <ToolbarButton
            icon={faArrowRotateRight}
            buttonProps={buttonProps.REDO}
            tooltip="Redo"
          />
          <ToolbarButton
            icon={faFloppyDisk}
            buttonProps={buttonProps.SAVE}
            tooltip="Save"
          />
          <ButtonPreviewAndRender
            buttonPreviewProps={buttonProps.PREVIEW}
            buttonRenderProps={buttonProps.DOWNLOAD}
          />
        </div>
      </div>
    </>
  );
};
