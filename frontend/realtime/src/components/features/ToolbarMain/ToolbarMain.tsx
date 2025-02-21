import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faCircle,
  faEraser,
  faFilePlus,
  faFloppyDisk,
  faImage,
  faLocationArrow,
  faPaintbrush,
  faShapes,
  faSquare,
  faText,
  faTriangle
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Fragment, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";

import { ToolbarButton } from "../ToolbarButton";

// style and constants
import { paperWrapperStyles, toolTipStyles } from "~/components/styles";
import { ToolbarMainButtonNames } from "./enum";

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
      { /* TODO: Figure out why divider shows up after the grid gap */}
      <div
        className={twMerge(
          "flex flex-col h-fit items-center divide-y divide-ui-border gap-y-2",
          paperWrapperStyles,
          disabled &&
          "pointer-events-none cursor-default bg-ui-border shadow-md",
        )}
      >
        <div className="flex flex-col items-center gap-2">
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
                data-tooltip="Add Shapes"
                className={twMerge(
                  "size-10 rounded-lg p-2 hover:bg-gray-200/50",
                  toolTipStyles,
                )}
              >
                <FontAwesomeIcon icon={faShapes} />
              </button>
            </PopoverButton>
            <PopoverPanel
              anchor="right"
              className={twMerge(
                // "absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2",
                "flex flex-row [--anchor-gap:16px]",
                paperWrapperStyles,
              )}
            >
              <ToolbarButton icon={faSquare} buttonProps={buttonProps.ADD_SQUARE} />
              <ToolbarButton icon={faCircle} buttonProps={buttonProps.ADD_CIRCLE} />
              <ToolbarButton icon={faTriangle} buttonProps={buttonProps.ADD_TRIANGLE} />
            </PopoverPanel>
          </Popover>

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
              anchor="right"
              className={twMerge(
                // "absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2",
                "flex [--anchor-gap:16px]",
                paperWrapperStyles,
              )}
            >
              <ToolbarButton icon={faImage} buttonProps={buttonProps.ADD_IMAGE}>
                Add Image
              </ToolbarButton>
              {/* <ToolbarButton icon={faFilm} buttonProps={buttonProps.ADD_VIDEO}>
                Add Video
              </ToolbarButton> */}
            </PopoverPanel>
          </Popover>

        </div>
        <div className="flex flex-col items-center gap-2">
          <ToolbarButton
            icon={faPaintbrush}
            buttonProps={buttonProps.PAINT}
            tooltip="Paint Brush"
          />
          <ToolbarButton
            icon={faEraser}
            buttonProps={buttonProps.ERASER}
            tooltip="Eraser"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
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
        </div>
      </div>
    </>
  );
};
