import {
  faFont,
  faHashtag,
  IconDefinition,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { twMerge } from "tailwind-merge";

import { useSignals } from "@preact/signals-react/runtime";
import { paperWrapperStyles } from "~/components/styles";
import {
  BRUSH_MAX_SIZE,
  BRUSH_MIN_SIZE,
  paintBrushSize,
  setPaintBrushSize,
} from "~/signals/uiEvents/toolbarMain/paintMode";

import { Slider } from "@storyteller/ui-slider";
import {
  eraseBrushSize,
  setEraseBrushSize,
} from "~/signals/uiEvents/toolbarMain/eraseMode";

export const EraseModeMenu = ({
  faIcon = faFont,
  borderStyle,
  anchor = "bottom",
  anchorGap = 0,
  defaultOpen = false,
  closeOnMouseLeave = false,
}: {
  faIcon?: IconDefinition;
  borderStyle?: string;
  anchor?: "top" | "right" | "bottom" | "left";
  anchorGap?: number;
  defaultOpen?: boolean;
  closeOnMouseLeave?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const handleMouseLeave = (close: () => void) => {
    if (closeOnMouseLeave) {
      setIsOpen(false);
      close();
    }
  };

  // Rerender the component when these signals change:
  useSignals();
  const brushSize = eraseBrushSize.value;

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <PopoverButton
            className={twMerge(
              "flex size-10 items-center justify-center gap-1 rounded-lg bg-ui-controls p-2",
              borderStyle,
            )}
            onMouseEnter={() => defaultOpen && setIsOpen(true)}
          >
            <FontAwesomeIcon icon={faIcon} />
          </PopoverButton>
          {(open || isOpen) && (
            <div onMouseLeave={() => handleMouseLeave(close)}>
              <PopoverPanel
                anchor={anchor}
                className={twMerge(
                  paperWrapperStyles,
                  "flex w-[198px] flex-col items-center gap-2 overflow-hidden",
                )}
                style={
                  {
                    "--anchor-gap": `${anchorGap}px`,
                  } as React.CSSProperties
                }
                static
              >
                <div className="flex w-full flex-col gap-2">
                  <p className="w-full justify-start text-sm font-medium text-white">
                    Eraser Size:
                  </p>
                  <Slider
                    min={BRUSH_MIN_SIZE}
                    max={BRUSH_MAX_SIZE}
                    value={brushSize}
                    onChange={setEraseBrushSize}
                    step={1}
                    innerLabel={brushSize.toString()}
                    showDecrement
                    showIncrement
                  />
                </div>
              </PopoverPanel>
            </div>
          )}
        </>
      )}
    </Popover>
  );
};
