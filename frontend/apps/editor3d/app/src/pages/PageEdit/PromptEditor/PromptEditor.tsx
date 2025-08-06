import React from "react";
import { PromptBoxEdit, PromptBoxEditProps } from "@storyteller/ui-promptbox";
import { JobProvider } from "~/pages/PageDraw/JobContext";

// Extending the props to include onFitPressed
interface ExtendedPromptEditorProps extends PromptBoxEditProps {
  onFitPressed?: () => void | Promise<void>;
}

const PromptEditor: React.FC<ExtendedPromptEditorProps> = ({
  onModeChange,
  selectedMode,
  onGenerateClick,
  isDisabled,
  onFitPressed,
  ...rest
}) => {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <PromptBoxEdit
        onModeChange={onModeChange}
        selectedMode={selectedMode}
        onGenerateClick={onGenerateClick}
        isDisabled={isDisabled}
        {...rest}
      />
      <JobProvider>
        <PromptBoxEdit
          onModeChange={onModeChange}
          selectedMode={selectedMode}
          onGenerateClick={onGenerateClick}
          isDisabled={false}
          onFitPressed={onFitPressed}
        />
      </JobProvider>
    </div>
  );
};

export default PromptEditor;
