export enum FontWeight {
  NORMAL = "normal",
  BOLD = "bold",
}
export enum FontStyle {
  NORMAL = "normal",
  ITALIC = "italic",
}
export enum TextAlign {
  LEFT = "left",
  RIGHT = "right",
  CENTER = "center",
  // JUSTIFY = "justify",
}
export enum TextDecoration {
  NONE = "none",
  STRIKETHROUGH = "line-through",
  UNDERLINE = "underline",
}
export type TextFormatData = {
  color: string;
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: FontStyle;
  fontWeight: FontWeight;
  textAlign: TextAlign;
  textDecoration: TextDecoration;
};
export type TextNodeData = {
  text: string;
} & TextFormatData;
import { useState } from "react";
import { TextEditor } from "../../../components/ui";
import { Button } from "@storyteller/ui-button";
import { Modal } from "@storyteller/ui-modal";

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
    <Modal isOpen={isOpen} onClose={closeCallback} className="w-fit max-w-2xl">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Edit Text</h2>
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
      </div>
    </Modal>
  );
};
