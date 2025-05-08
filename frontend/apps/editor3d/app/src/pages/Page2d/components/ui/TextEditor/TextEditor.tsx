import { ChangeEvent, useCallback, useEffect, useRef } from "react";

import { Textarea, TextareaInterface, ResizeType } from "../TextArea";
import { InputNumber } from "../InputNumber";
import { Combobox } from "../ComboBox";

import { ButtonsAlignments } from "./ButtonsAlignment";
import { ButtonsTextStyles } from "./ButtonTextStyles";
import { ColorPicker } from "./ColorPicker";
import {
  TextFormatData,
  TextAlign,
  TextDecoration,
  FontStyle,
  FontWeight,
} from "./types";

const FontFamilies = ["Arial", "Helvetica", "Times New Roman", "Comic Sans MS"];

export const TextEditor = ({
  text,
  formatData,
  onChangeText,
  onChangeFormatting,
  TextareaProps,
}: {
  text: string;
  formatData: TextFormatData;
  onChangeText: (newText: string) => void;
  onChangeFormatting: (newFormatData: Partial<TextFormatData>) => void;
  TextareaProps?: TextareaInterface;
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const focusOnTextArea = useCallback(() => {
    if (textAreaRef.current === null) {
      return;
    }
    textAreaRef.current.focus();
  }, []);
  useEffect(() => {
    focusOnTextArea();
  }, []);

  const handleOnChangeText = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChangeText(e.target.value);
      focusOnTextArea();
    },
    [onChangeText],
  );
  const onChangeTextAlignment = useCallback(
    (newAlignment: TextAlign) => {
      onChangeFormatting({
        textAlign: newAlignment,
      });
      focusOnTextArea();
    },
    [onChangeFormatting],
  );
  const onChangeFontStyle = useCallback(
    (newStyle: FontStyle) => {
      onChangeFormatting({
        fontStyle: newStyle,
      });
      focusOnTextArea();
    },
    [onChangeFormatting],
  );
  const onChangeFontWeight = useCallback(
    (newWeight: FontWeight) => {
      onChangeFormatting({
        fontWeight: newWeight,
      });
      focusOnTextArea();
    },
    [onChangeFormatting],
  );
  const onChangeTextDecoration = useCallback(
    (newDecor: TextDecoration) => {
      onChangeFormatting({
        textDecoration: newDecor,
      });
      focusOnTextArea();
    },
    [onChangeFormatting],
  );
  const onChangeFontFamily = useCallback(
    (newFontFamily: string) => {
      onChangeFormatting({
        fontFamily: newFontFamily,
      });
      focusOnTextArea();
    },
    [onChangeFormatting],
  );
  const onChangeTextColor = useCallback(
    (newTextColor: string) => {
      onChangeFormatting({
        color: newTextColor,
      });
    },
    [onChangeFormatting],
  );
  const onChangeFontSize = useCallback(
    (newVal: number) => {
      onChangeFormatting({
        fontSize: newVal,
      });
      // focusOnTextArea();
    },
    [onChangeFormatting],
  );

  const TextAreaStates = {
    style: {
      ...formatData,
      width: "500px",
      height: "240px",
    },
    placeholder: "...",
    resize: "none" as ResizeType,
    onChange: handleOnChangeText,
    value: text,
  };
  const unionedTextAreaProps = {
    ...TextareaProps,
    ...TextAreaStates,
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Combobox
          options={FontFamilies}
          value={formatData.fontFamily}
          onChange={onChangeFontFamily}
        />
        <ColorPicker color={formatData.color} onChange={onChangeTextColor} />
        <InputNumber value={formatData.fontSize} onChange={onChangeFontSize} />
      </div>
      <div className="flex items-center gap-4">
        <ButtonsAlignments
          value={formatData.textAlign}
          onChange={onChangeTextAlignment}
        />
        <ButtonsTextStyles
          fontWeight={formatData.fontWeight}
          fontStyle={formatData.fontStyle}
          textDecoration={formatData.textDecoration}
          onChangeFontWeight={onChangeFontWeight}
          onChangeFontStyle={onChangeFontStyle}
          onChangeTextDecoration={onChangeTextDecoration}
        />
      </div>
      <Textarea
        className="bg-white"
        {...unionedTextAreaProps}
        ref={textAreaRef}
      />
    </div>
  );
};
