import { ChangeEvent, useState } from "react";
import { twMerge } from "tailwind-merge";
import { faFont, faHashtag, IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { HexColorPicker } from "react-colorful";

import { Button } from "../Button";
import { Input } from "../Input";
import { paperWrapperStyles } from "~/components/styles";

export const ColorPicker = ({
  color: prevColor,
  onChange,
  faIcon = faFont,
  borderStyle = "border",
  showBar = true,
}: {
  color: string;
  onChange: (newColor: string) => void;
  faIcon?: IconDefinition;
  borderStyle?: string;
  showBar?: boolean;
}) => {
  const [{ currColor, textInput }, setStates] = useState<{
    currColor: string;
    textInput: string;
  }>({
    currColor: prevColor,
    textInput: prevColor.substring(1),
  });

  const handleSelectColor = (newColor: string) => {
    setStates({ currColor: newColor, textInput: newColor.substring(1) });
  };
  const isHexColorCode = (color: string) => {
    const hexColorRegex = /^(?:[0-9a-fA-F]{3}){1,2}$/;
    return hexColorRegex.test(color);
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

  return (
    <Popover className="relative">
      <PopoverButton className={twMerge(
        "flex size-10 flex-col items-center gap-1 rounded-md p-2",
        borderStyle
      )}>
        <FontAwesomeIcon icon={faIcon} color={prevColor} />
        {showBar && <span className="h-1 w-full" style={{ backgroundColor: prevColor }} />}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom"
        className={twMerge(
          paperWrapperStyles,
          "flex flex-col items-center gap-2",
        )}
      >
        {({ close }) => {
          return (
            <>
              <HexColorPicker color={currColor} onChange={handleSelectColor} />
              <Input
                style={{ width: "198px" }}
                icon={faHashtag}
                value={textInput}
                onChange={handleTextInput}
              />
              <div className="flex w-full justify-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStates({
                      currColor: prevColor,
                      textInput: prevColor.substring(1),
                    });
                    close();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onChange(currColor);
                    close();
                  }}
                >
                  OK
                </Button>
              </div>
            </>
          );
        }}
      </PopoverPanel>
    </Popover>
  );
};
