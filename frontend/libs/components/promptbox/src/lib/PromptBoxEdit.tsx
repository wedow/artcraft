import {
  faEdit,
  faExpand,
  faMessageCheck,
  faMessageXmark,
  faMousePointer,
  faSparkles,
  faSpinnerThird
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSignals } from "@preact/signals-react/runtime";
import { Button, ToggleButton } from "@storyteller/ui-button";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useEffect, useRef, useState } from "react";

export interface PromptBoxEditProps {
  onModeChange?: (mode: string) => void;
  selectedMode?: string;
  onGenerateClick: () => void;
  isDisabled?: boolean;
}

export const PromptBoxEdit = ({
  onModeChange: onModeSelectionChange,
  selectedMode,
  onGenerateClick,
  isDisabled
}: PromptBoxEditProps) => {
  useSignals();

  const [prompt, setPrompt] = useState("");
  const [useSystemPrompt, setUseSystemPrompt] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  });

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedText = e.clipboardData.getData("text").trim();
    setPrompt(pastedText);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    setPrompt(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Stop propagation of keyboard events to prevent them from reaching the canvas
    e.stopPropagation();

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // handleEnqueue();
    }
  };

  const modes = [
    {
      value: "select",
      icon: faMousePointer,
      text: "Select",
      tooltip: "Selection mode",
    },
    {
      value: "edit",
      icon: faEdit,
      text: "Edit Region",
      tooltip: "Edit area for inpainting",
    },
    {
      value: "expand",
      icon: faExpand,
      text: "Expand",
      tooltip: "Expand area for outpainting",
    },
  ];

  return (
    <>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-3">
        <div className="glass w-[730px] rounded-xl p-4">
          <div className="flex justify-center gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Describe your image..."
              className="text-md mb-2 max-h-[5.5em] flex-1 resize-none overflow-y-auto rounded bg-transparent pb-2 pr-2 pt-1 text-white placeholder-white placeholder:text-white/60 focus:outline-none"
              value={prompt}
              onChange={handleChange}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onFocus={() => { }}
              onBlur={() => { }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ButtonIconSelect
                options={modes}
                onOptionChange={onModeSelectionChange}
                selectedOption={selectedMode}
              />
              <Tooltip
                content={
                  useSystemPrompt
                    ? "Use system prompt: ON"
                    : "Use system prompt: OFF"
                }
                position="top"
                className="z-50"
                delay={200}
              >
                <ToggleButton
                  isActive={useSystemPrompt}
                  icon={faMessageXmark}
                  activeIcon={faMessageCheck}
                  onClick={() => setUseSystemPrompt(!useSystemPrompt)}
                />
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="flex items-center border-none bg-primary px-3 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                icon={!isDisabled ? faSparkles : undefined}
                onClick={onGenerateClick}
                disabled={isDisabled || !prompt.trim()}
              >
                {isDisabled ? (
                  <FontAwesomeIcon
                    icon={faSpinnerThird}
                    className="animate-spin text-lg"
                  />
                ) : (
                  "Generate"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
