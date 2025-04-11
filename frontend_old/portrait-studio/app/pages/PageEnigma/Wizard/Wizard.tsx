import { SelectOption, TransitionDialogue } from "~/components";
import {
  currentStep,
  selectedRemixCard,
  showWizard,
  textInput,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { WizardStep } from "~/pages/PageEnigma/Wizard/WizardStep";
import { resetSceneGenerationMetadata } from "~/pages/PageEnigma/signals";
import { CameraAspectRatio } from "~/pages/PageEnigma/enums";
import { useContext, useMemo } from "react";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";

export enum WizardType {
  BACKGROUND = "background",
  CHARACTER = "character",
  OBJECT = "object",
  QUESTION = "question",
  MAIN_PAGE = "main-page",
  REMIX = "remix",
  TEXT_FIELD = "text_field",
  NONE = "none",
}

export interface WizardItem {
  label: string;
  type: WizardType;
  options?: SelectOption[];
  showNext?: () => boolean;
  nextTitle?: string;
  showPrior?: () => boolean;
  priorTitle?: string;
  onPrior?: string;
  nextPage?: string;
  onNext?: (() => void) | string;
  width?: number;
}

export const Wizard = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);

  const wizardItems: Record<string, WizardItem> = useMemo(
    () => ({
      initial: {
        label: "Welcome to Storyteller Studio",
        type: WizardType.MAIN_PAGE,
        showPrior: () => false,
        showNext: () => false,
        options: [
          {
            label: "Remix",
            value: "remix",
          },
          {
            label: "Blank Scene",
            value: "end",
          },
        ],
        width: 593,
      },
      new_scene: {
        label: "Create a New Scene",
        type: WizardType.MAIN_PAGE,
        showPrior: () => false,
        showNext: () => false,
        options: [
          {
            label: "Remix",
            value: "remix",
          },
          {
            label: "Blank Scene",
            value: "new_scene_title",
          },
        ],
        width: 593,
      },
      new_scene_title: {
        label: "Add New Scene Title",
        type: WizardType.TEXT_FIELD,
        showNext: () => !!textInput.value,
        nextTitle: "Add New Scene",
        onNext: () => {
          resetSceneGenerationMetadata();
          editorEngine?.changeRenderCameraAspectRatio(
            CameraAspectRatio.SQUARE_1_1,
          );
          editorEngine?.newScene(textInput.value);
          showWizard.value = "end";
        },
        priorTitle: "Cancel",
        onPrior: "new_scene",
      },
      remix: {
        label: "Choose a Scene to Remix",
        type: WizardType.REMIX,
        nextTitle: "Remix Scene",
        showNext: () => !!selectedRemixCard.value,
        priorTitle: "Cancel",
        onPrior: "initial",
        onNext: () => {
          if (editorEngine && selectedRemixCard.value) {
            editorEngine.loadScene(selectedRemixCard.value?.token);
            showWizard.value = "end";
          }
        },
        onBack: () => {
          showWizard.value = "initial";
        },
        width: 1152,
      },
      wizard: {
        label: "What kind of scene do you want?",
        type: WizardType.QUESTION,
        showNext: () => false,
        options: [
          {
            label: "Dance",
            value: "dance",
          },
          {
            label: "Monologue",
            value: "mono",
          },
        ],
      },
      dance: {
        label: "Pick a background",
        type: WizardType.BACKGROUND,
        nextPage: "danceCharacter",
      },
      danceCharacter: {
        label: "Pick a character",
        type: WizardType.CHARACTER,
        nextPage: "end",
      },
      mono: {
        label: "Pick a character",
        type: WizardType.CHARACTER,
        nextPage: "end",
      },
    }),
    [editorEngine],
  );

  useSignalEffect(() => {
    if (showWizard.value === "end") {
      return;
    }
    currentStep.value = wizardItems[showWizard.value];
  });

  if (!currentStep.value) {
    return null;
  }

  return (
    <TransitionDialogue
      isOpen={showWizard.value !== "end"}
      onClose={() => (showWizard.value = "end")}
      title={currentStep.value.label}
      width={currentStep.value.width ?? 672}
      titleIcon={showWizard.value === "remix" ? faChevronLeft : undefined}
      titleIconClassName="text-white/60 hover:text-white/80 transition-colors duration-150"
      onTitleIconClick={
        showWizard.value === "remix"
          ? () => (showWizard.value = "initial")
          : undefined
      }
    >
      <WizardStep />
    </TransitionDialogue>
  );
};
