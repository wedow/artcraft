import React from "react";
import { PromptBoxEdit, PromptBoxEditProps } from "@storyteller/ui-promptbox";

// Set this value on when enqueue is pressed nasty global variable.
import { JobProvider } from "~/pages/PageDraw/JobContext";
const PromptEditor: React.FC<PromptBoxEditProps> = ({
  onModeChange,
  selectedMode,
  onGenerateClick,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <div className="flex w-full justify-center">
      </div>

      <JobProvider>
        <PromptBoxEdit
          onModeChange={onModeChange}
          selectedMode={selectedMode}
          onGenerateClick={onGenerateClick}
          isDisabled={false}
        />
      </JobProvider>
    </div>
  );
};

export default PromptEditor;
