import { useSignalEffect } from "@preact/signals-react";
import { useRef } from "react";
import { ResizeType, Textarea } from "~/components/ui";
import { dispatchUiEvents } from "~/signals";
import { promptText } from "~/signals/uiEvents/promptSettings";
import { invoke } from '@tauri-apps/api/core';
import { dispatchers } from "~/signals/uiEvents/toolbarMain";
import { ToolbarMainButtonNames } from "~/components/features/ToolbarMain/enum";

export const SignaledPromptText = ({}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const TextAreaStates = {
    placeholder: "Type your prompt here...",
    label: "",
    resize: "none" as ResizeType,
    rows: 3,
  };

  const textContent = promptText.value;
  const onTextChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatchUiEvents.promptSettings.setPrompt(event.target.value);
  };

  // This makes component re-render whenever the signal value changes
  useSignalEffect(() => {
    promptText.value;
  });

  return (
    <div className="fixed bottom-5 left-1/2 w-[400px] -translate-x-1/2 text-[16px] font-medium shadow-lg">
      <Textarea
        className="glass rounded-xl"
        {...TextAreaStates}
        ref={textAreaRef}
        onChange={onTextChanged}
        value={textContent}
        spellCheck={false}
        forceBlurOnOutsideClick={true}
      />
      <button 
        onClick={dispatchers[ToolbarMainButtonNames.GENERATE]}
        style={{backgroundColor:"#ff0000", color: "#00ff00"}}
        >Submit</button>
    </div>
  );
};
