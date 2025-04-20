import { Background } from "./Background";
import { Button } from "~/components";
import { Objects } from "./Objects";
import { Characters } from "./Characters";
import {
  currentStep,
  showWizard,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { useSignals } from "@preact/signals-react/runtime";
import { Question } from "~/pages/PageEnigma/Wizard/Question";
import { WizardItem, WizardType } from "~/pages/PageEnigma/Wizard/Wizard";
import { MainPage } from "~/pages/PageEnigma/Wizard/MainPage";
import { Remix } from "~/pages/PageEnigma/Wizard/Remix";
import { TextField } from "~/pages/PageEnigma/Wizard/TextField";

export const WizardStep = () => {
  useSignals();
  const step = currentStep.value as WizardItem;
  if (!step.nextTitle) {
    step.nextTitle = "Next";
  }
  if (!step.priorTitle) {
    step.priorTitle = "Prior";
  }

  const wizardComponents: Record<WizardType, (() => JSX.Element) | null> = {
    [WizardType.BACKGROUND]: Background,
    [WizardType.CHARACTER]: Characters,
    [WizardType.OBJECT]: Objects,
    [WizardType.QUESTION]: Question,
    [WizardType.MAIN_PAGE]: MainPage,
    [WizardType.REMIX]: Remix,
    [WizardType.TEXT_FIELD]: TextField,
    [WizardType.NONE]: null,
  };

  const Component = wizardComponents[step.type];
  if (Component === null) {
    return null;
  }

  return (
    <div>
      <Component />
      <div className="flex justify-end gap-2 pt-4">
        {(!step.showPrior || step.showPrior()) && (
          <Button
            variant="action"
            onClick={() => {
              showWizard.value = step.onPrior!;
            }}
          >
            {step.priorTitle}
          </Button>
        )}
        {(!step.showNext || step.showNext()) && (
          <Button
            onClick={() => {
              if (typeof step.onNext === "string") {
                showWizard.value = step.onNext;
                return;
              }
              if (step.onNext) {
                step.onNext();
              }
            }}
          >
            {step.nextTitle}
          </Button>
        )}
      </div>
    </div>
  );
};
