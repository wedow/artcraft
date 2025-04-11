import { WizardItem } from "~/pages/PageEnigma/Wizard/Wizard";
import { useSignals } from "@preact/signals-react/runtime";
import { Select } from "~/components";
import {
  currentStep,
  showWizard,
} from "~/pages/PageEnigma/Wizard/signals/wizard";

export const Question = () => {
  useSignals();
  const item = currentStep.value as WizardItem;

  return (
    <Select
      options={item.options!}
      onChange={(value) => (showWizard.value = value)}
      placeholder={item.label}
    />
  );
};
