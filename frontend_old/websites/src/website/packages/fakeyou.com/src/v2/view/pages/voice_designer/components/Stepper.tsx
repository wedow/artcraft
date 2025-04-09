import React from "react";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="stepper-container d-flex w-100 gap-3">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`position-relative d-flex ${
            index !== steps.length - 1 ? "w-100" : ""
          } align-items-center gap-3 ${index < currentStep ? "prev-step" : ""}`}
        >
          <div
            className={`stepper-number ${
              index === currentStep ? "active" : ""
            }`}
          >
            {index + 1}
          </div>
          <div
            className={`stepper-description ${
              index === currentStep ? "active" : ""
            }`}
          >
            {step}
          </div>
          {index !== steps.length - 1 && (
            <div
              className={`stepper-line ${index <= currentStep ? "active" : ""}`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export { Stepper };
