import { Button } from "components/common";
import React from "react";
import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";

interface StepperControlsProps {
  onBack: () => void;
  onNext: () => void;
  onCreate: () => void;
  createDisabled: boolean;
  steps: string[];
  currentStep: number;
  continueDisabled?: boolean;
}

const StepperControls: React.FC<StepperControlsProps> = ({
  onBack,
  onNext,
  steps,
  currentStep,
  onCreate,
  createDisabled,
  continueDisabled,
}) => {
  return (
    <>
      <hr className="mt-0 mb-4" />

      <div className="p-3 pb-4 px-lg-4 pt-0 d-flex gap-3 justify-content-end">
        {currentStep === 1 && (
          <Button label="Back" variant="secondary" onClick={onBack} />
        )}

        {currentStep === 0 && (
          <>
            <Button label="Cancel" variant="secondary" to="/voice-designer" />
            <Button
              label="Continue"
              onClick={onNext}
              disabled={continueDisabled}
              iconFlip={true}
              icon={faChevronRight}
            />
          </>
        )}

        {currentStep === 1 && (
          <Button
            label="Create Voice"
            onClick={onCreate}
            disabled={createDisabled}
            iconFlip={true}
            icon={faChevronRight}
          />
        )}
      </div>
    </>
  );
};

export { StepperControls };
