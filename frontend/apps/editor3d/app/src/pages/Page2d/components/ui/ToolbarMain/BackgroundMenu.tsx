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
import { Button } from "@storyteller/ui-button";
import { HexEyedropPicker } from "../HexEyedropPicker";
import { Input } from "@storyteller/ui-input";

export const BackgroundMenu = ({
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

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const handleMouseLeave = (close: () => void) => {
    if (closeOnMouseLeave) {
      onChange(currColor);
      setIsOpen(false);
      close();
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

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <PopoverButton
            className={twMerge(
              "flex size-10 items-center gap-1 rounded-lg bg-ui-controls p-2 transition-all duration-100",
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
            <div onMouseLeave={() => handleMouseLeave(close)}>
              <PopoverPanel
                anchor={anchor}
                className={twMerge(
                  paperWrapperStyles,
                  "flex flex-col items-center gap-2 overflow-hidden",
                )}
                style={
                  {
                    "--anchor-gap": `${anchorGap}px`,
                  } as React.CSSProperties
                }
                static
              >
                <HexEyedropPicker
                  pickerClassName="overflow-hidden"
                  color={currColor}
                  onPickerChange={handleColorChange}
                  onDropperChange={handleColorChange}
                  Picker={HexColorPicker}
                />
                <Input
                  style={{ width: "198px" }}
                  icon={faHashtag}
                  value={textInput}
                  onChange={handleTextInput}
                />
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
