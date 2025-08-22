import React from "react";
import { PromptBoxEdit, PromptBoxEditProps } from "@storyteller/ui-promptbox";

const PromptEditor: React.FC<PromptBoxEditProps> = ({
  onModeChange,
  selectedMode,
  onGenerateClick,
  isDisabled,
  onFitPressed,
  modelInfo,
  generationCount,
  onGenerationCountChange,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <PromptBoxEdit
        onModeChange={onModeChange}
        selectedMode={selectedMode}
        onGenerateClick={onGenerateClick}
        isDisabled={isDisabled}
        onFitPressed={onFitPressed}
        modelInfo={modelInfo}
        generationCount={generationCount}
        onGenerationCountChange={onGenerationCountChange}
      />
    </div>
  );
};

export default React.memo(PromptEditor);
