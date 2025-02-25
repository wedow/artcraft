import {
  faArrowRotateLeft,
  faArrowRotateRight,
  faCircle,
  faEraser,
  faFilePlus,
  faImage,
  faLocationArrow,
  faPaintbrush,
  faShapes,
  faSquare,
  faText,
  faTriangle,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Fragment, MouseEventHandler } from "react";
import { twMerge } from "tailwind-merge";

import { ToolbarButton } from "../ToolbarButton";

// style and constants
import { paperWrapperStyles, toolTipStyles } from "~/components/styles";
import { ToolbarMainButtonNames } from "./enum";
import { dispatchUiEvents, uiEvents } from "~/signals/uiEvents";
import { paintColor } from "~/signals/uiEvents/toolbarMain/paintMode";
import { ColorPicker } from "~/components/ui/TextEditor/ColorPicker";
import { PaintModeMenu } from "~/components/ui/ToolbarMain/PaintModeMenu";
import { EraseModeMenu } from "~/components/ui/ToolbarMain/EraseModeMenu";

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
          "flex h-fit flex-col items-center gap-y-2",
          paperWrapperStyles,
          "glass",
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
            {({ close }) => (
              <>
                <PopoverButton as={Fragment}>
                  <button
                    data-tooltip="Add Shapes"
                    className={twMerge(
                      "size-10 rounded-lg border-2 border-transparent text-white/80 transition-all duration-100 hover:bg-white/15",
                      toolTipStyles.base,
                      toolTipStyles.right,
                    )}
                  >
                    <FontAwesomeIcon icon={faShapes} />
                  </button>
                </PopoverButton>
                <PopoverPanel
                  anchor="right"
                  className={twMerge(
                    "flex flex-row [--anchor-gap:12px]",
                    paperWrapperStyles,
                  )}
                >
                  <ToolbarButton
                    icon={faSquare}
                    buttonProps={{
                      ...buttonProps.ADD_SQUARE,
                      onClick: (e) => {
                        buttonProps.ADD_SQUARE.onClick?.(e);
                        close();
                      },
                    }}
                  />
                  <ToolbarButton
                    icon={faCircle}
                    buttonProps={{
                      ...buttonProps.ADD_CIRCLE,
                      onClick: (e) => {
                        buttonProps.ADD_CIRCLE.onClick?.(e);
                        close();
                      },
                    }}
                  />
                  <ToolbarButton
                    icon={faTriangle}
                    buttonProps={{
                      ...buttonProps.ADD_TRIANGLE,
                      onClick: (e) => {
                        buttonProps.ADD_TRIANGLE.onClick?.(e);
                        close();
                      },
                    }}
                  />
                </PopoverPanel>
              </>
            )}
          </Popover>

          <Popover className="relative">
            <PopoverButton as={Fragment}>
              <button
                data-tooltip="Add Media"
                className={twMerge(
                  "size-10 rounded-lg border-2 border-transparent text-white/80 transition-all duration-100 hover:bg-white/15",
                  toolTipStyles.base,
                  toolTipStyles.right,
                )}
              >
                <FontAwesomeIcon icon={faFilePlus} />
              </button>
            </PopoverButton>
            <PopoverPanel
              anchor="right"
              className={twMerge(
                // "absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2",
                "flex [--anchor-gap:12px]",
                paperWrapperStyles,
              )}
            >
              <ToolbarButton icon={faImage} buttonProps={buttonProps.ADD_IMAGE}>
                <span className="text-[16px]">Add Image</span>
              </ToolbarButton>
              {/* <ToolbarButton icon={faFilm} buttonProps={buttonProps.ADD_VIDEO}>
                Add Video
              </ToolbarButton> */}
            </PopoverPanel>
          </Popover>
        </div>

        <hr className="w-full border-t border-white/15" />

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            { /* Conditionally show paint menu on mode selection */}
            {buttonProps.PAINT.active ? (
              <div className="relative">
                <PaintModeMenu
                  color={paintColor.value}
                  onChange={dispatchUiEvents.toolbarMain.setPaintColor}
                  faIcon={faPaintbrush}
                  borderStyle="border-2  bg-primary/30 border-2 border-primary hover:bg-primary/30 text-white"
                  showBar={false}
                  staticIconColor="white"
                  streamChanges
                  defaultOpen={true}
                  anchor="right"
                  anchorGap={12}
                  closeOnMouseLeave={true}
                />
                <div
                  className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-[18px] w-[18px] rounded-full border border-gray-400"
                  style={{ backgroundColor: paintColor.value }}
                />
              </div>
            ) : (
              <ToolbarButton
                icon={faPaintbrush}
                buttonProps={buttonProps.PAINT}
                tooltip="Paint Brush"
              />
            )}

            { /* Conditionally show eraser menu on mode selection */}
            {buttonProps.ERASER.active ? (
              <EraseModeMenu
                faIcon={faEraser}
                borderStyle="border-2  bg-primary/30 border-2 border-primary hover:bg-primary/30 text-white"
                defaultOpen={true}
                anchor="right"
                anchorGap={12}
                closeOnMouseLeave={true}
              />
            )
              : (
                <ToolbarButton
                  icon={faEraser}
                  buttonProps={buttonProps.ERASER}
                  tooltip="Eraser"
                />
              )}
          </div>
        </div>

        <hr className="w-full border-t border-white/15" />

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
          {/* <ToolbarButton
            icon={faFloppyDisk}
            buttonProps={buttonProps.SAVE}
            tooltip="Save"
          /> */}
        </div>
      </div>
    </>
  );
};
