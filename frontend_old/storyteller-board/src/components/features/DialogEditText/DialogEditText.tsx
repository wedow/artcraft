import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Button, TextEditor } from "~/components/ui";
import { TextNodeData } from "~/KonvaApp/types";

import {
  dialogBackgroundStyles,
  dialogPanelStyles,
  paperWrapperStyles,
} from "~/components/styles";

import {
  TextFormatData,
  FontStyle,
  FontWeight,
  TextAlign,
  TextDecoration,
} from "~/components/ui/TextEditor/types";

export const DialogEditText = ({
  isOpen,
  closeCallback,
  onDoneEditText,
}: {
  isOpen: boolean;
  closeCallback: () => void;
  onDoneEditText: (doneData: TextNodeData) => void;
}) => {
  const [text, setText] = useState<string>("");
  const [textFormatData, setTextFormatData] = useState<TextFormatData>({
    color: "#000000",
    maxWidth: 500,
    fontFamily: "Arial",
    fontSize: 20,
    fontStyle: FontStyle.NORMAL,
    fontWeight: FontWeight.NORMAL,
    textAlign: TextAlign.CENTER,
    textDecoration: TextDecoration.NONE,
  });

  const handleOnChangeText = (newText: string) => {
    setText(newText);
  };
  const handleOnChangeFormatting = (newFormatData: Partial<TextFormatData>) => {
    setTextFormatData((curr) => ({
      ...curr,
      ...newFormatData,
    }));
  };
  const handleOnDoneEditText = () => {
    const textNodeData = {
      text: text,
      ...textFormatData,
      // fill: textFormatData.color,
      // fontFamily: textFormatData.fontFamily,
      // fontSize: textFormatData.fontSize,
      // align: textFormatData.textAlign,
      // fontStyle:
      //   textFormatData.fontStyle === FontStyle.NORMAL &&
      //   textFormatData.fontWeight === FontWeight.NORMAL
      //     ? "normal"
      //     : `${textFormatData.fontWeight !== FontWeight.NORMAL ? textFormatData.fontWeight : ""} ${textFormatData.fontStyle !== FontStyle.NORMAL ? textFormatData.fontStyle : ""}`,
      // textDecoration:
      //   textFormatData.textDecoration === TextDecoration.NONE
      //     ? ""
      //     : textFormatData.textDecoration,
    };
    onDoneEditText(textNodeData);
    closeCallback();
  };
  return (
    <Dialog open={isOpen} onClose={closeCallback} className="relative z-50">
      <div className={dialogBackgroundStyles}>
        <DialogPanel className={twMerge(paperWrapperStyles, dialogPanelStyles)}>
          <DialogTitle className="text-3xl font-bold">Edit Text</DialogTitle>
          <TextEditor
            text={text}
            formatData={textFormatData}
            onChangeText={handleOnChangeText}
            onChangeFormatting={handleOnChangeFormatting}
          />
          <div className="flex w-full justify-end gap-2">
            <Button onClick={closeCallback} variant="secondary">
              Cancel
            </Button>

            <Button
              className="hover:animate-pulse"
              onClick={handleOnDoneEditText}
              disabled={text === ""}
            >
              Enter
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
