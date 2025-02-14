import { useSignalEffect } from "@preact/signals-react";
import { useCallback, useEffect, useRef } from "react";
import { ResizeType, Textarea } from "~/components/ui";
import { dispatchUiEvents } from "~/signals";
import { promptText } from "~/signals/uiEvents/promptSettings";

export const SignaledPromptText = ({
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

  const TextAreaStates = {
    style: {
      width: "500px",
      height: "240px",
    },
    placeholder: "...",
    label: "Prompt Text",
    resize: "none" as ResizeType,
  };

  const textContent = promptText.value;
  const onTextChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatchUiEvents.promptSettings.setPrompt(event.target.value);
  };

  // This makes component re-render whenever the signal value changes
  useSignalEffect(() => {
    promptText.value;
  })

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
      <Textarea {...TextAreaStates} ref={textAreaRef} onChange={onTextChanged} value={textContent} />
    </div>
  );
};
