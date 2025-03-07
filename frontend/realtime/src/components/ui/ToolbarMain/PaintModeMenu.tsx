import {
  faFont,
  faHashtag,
  IconDefinition,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { ChangeEvent, useEffect, useState, useRef } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { twMerge } from "tailwind-merge";

import { useSignals } from "@preact/signals-react/runtime";
import { paperWrapperStyles } from "~/components/styles";
import {
  BRUSH_MAX_SIZE,
  BRUSH_MIN_SIZE,
  paintBrushSize,
  setPaintBrushSize,
} from "~/signals/uiEvents/toolbarMain/paintMode";
import { Button } from "../Button";
import { Input } from "../Input";
import { Slider } from "../Slider";
import { HexEyedropPicker } from "../HexEyedropPicker";

export const PaintModeMenu = ({
  color: prevColor,
  onChange,
  faIcon = faFont,
  borderStyle,
  showBar = true,
  anchor = "bottom",
  anchorGap = 0,
  fillBg = false,
  staticIconColor,
  streamChanges = false,
  defaultOpen = false,
  closeOnMouseLeave = false,
}: {
  color: string;
  onChange: (newColor: string) => void;
  faIcon?: IconDefinition;
  borderStyle?: string;
  showBar?: boolean;
  anchor?: "top" | "right" | "bottom" | "left";
  anchorGap?: number;
  fillBg?: boolean;
  staticIconColor?: string;
  streamChanges?: boolean;
  defaultOpen?: boolean;
  closeOnMouseLeave?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [{ currColor, textInput }, setStates] = useState<{
    currColor: string;
    textInput: string;
  }>({
    currColor: prevColor,
    textInput: prevColor.substring(1),
  });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isMouseOutside, setIsMouseOutside] = useState(false);
  const closeRef = useRef<(() => void) | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDown) {
        setIsMouseDown(false);

        // If mouse is outside when released, close the panel after a short delay
        if (isMouseOutside && closeOnMouseLeave && closeRef.current) {
          closeTimeoutRef.current = setTimeout(() => {
            onChange(currColor);
            setIsOpen(false);
            closeRef.current?.();
          }, 500);
        }
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isMouseDown, isMouseOutside, closeOnMouseLeave, currColor, onChange]);

  const handleMouseLeave = (close: () => void) => {
    closeRef.current = close;
    setIsMouseOutside(true);

    // Only close if mouse is not down and closeOnMouseLeave is true
    if (closeOnMouseLeave && !isMouseDown) {
      closeTimeoutRef.current = setTimeout(() => {
        onChange(currColor);
        setIsOpen(false);
        close();
      }, 200);
    }
  };

  const handleMouseEnter = () => {
    setIsMouseOutside(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleTextInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (isHexColorCode(e.target.value)) {
      setStates({
        currColor: `#${e.target.value}`,
        textInput: e.target.value,
      });
    } else {
      setStates((curr) => ({
        ...curr,
        textInput: e.target.value,
      }));
    }
  };

  const isHexColorCode = (color: string) => {
    const hexColorRegex = /^(?:[0-9a-fA-F]{3}){1,2}$/;
    return hexColorRegex.test(color);
  };

  const handleColorChange = (color: string) => {
    setStates({
      currColor: color,
      textInput: color.substring(1),
    });
    if (streamChanges) {
      onChange(color);
    }
  };

  // Rerender the component when these signals change:
  useSignals();
  const brushSize = paintBrushSize.value;

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <PopoverButton
            className={twMerge(
              "flex size-10 items-center gap-1 rounded-lg bg-ui-controls p-2",
              borderStyle,
              showBar ? "flex-col" : "justify-center",
            )}
            style={fillBg ? { backgroundColor: prevColor } : {}}
            onMouseEnter={() => defaultOpen && setIsOpen(true)}
          >
            <FontAwesomeIcon
              icon={faIcon}
              color={staticIconColor ?? (fillBg ? undefined : prevColor)}
            />
            {showBar && (
              <span
                className="h-1 w-full"
                style={{ backgroundColor: prevColor }}
              />
            )}
          </PopoverButton>
          {(open || isOpen) && (
            <div
              onMouseLeave={() => handleMouseLeave(close)}
              onMouseEnter={handleMouseEnter}
              onMouseDown={() => setIsMouseDown(true)}
            >
              <PopoverPanel
                anchor={anchor}
                className={twMerge(
                  paperWrapperStyles,
                  "flex flex-col items-center gap-2 overflow-hidden p-4",
                )}
                style={
                  {
                    "--anchor-gap": `${anchorGap}px`,
                  } as React.CSSProperties
                }
                static
              >
                <HexEyedropPicker
                  color={currColor}
                  onPickerChange={handleColorChange}
                  onDropperChange={handleColorChange}
                  Picker={HexAlphaColorPicker}
                />
                <Input
                  className="mt-2"
                  inputClassName="bg-ui-background/30"
                  style={{ width: "198px" }}
                  icon={faHashtag}
                  value={textInput}
                  onChange={handleTextInput}
                />
                <div className="mt-2 flex w-full flex-col gap-2">
                  <p className="w-full justify-start text-sm font-medium text-white">
                    Brush Size:
                  </p>
                  <Slider
                    min={BRUSH_MIN_SIZE}
                    max={BRUSH_MAX_SIZE}
                    value={brushSize}
                    onChange={setPaintBrushSize}
                    step={1}
                    innerLabel={brushSize.toString()}
                    showDecrement
                    showIncrement
                  />
                </div>
                {!streamChanges && (
                  <div className="flex w-full justify-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStates({
                          currColor: prevColor,
                          textInput: prevColor.substring(1),
                        });
                        setIsOpen(false);
                        close();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        onChange(currColor);
                        setIsOpen(false);
                        close();
                      }}
                    >
                      OK
                    </Button>
                  </div>
                )}
              </PopoverPanel>
            </div>
          )}
        </>
      )}
    </Popover>
  );
};
