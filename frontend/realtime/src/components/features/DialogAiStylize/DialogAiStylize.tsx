import { useCallback, useEffect, useState } from "react";
import { DialogTitle } from "@headlessui/react";
import { faWandSparkles } from "@fortawesome/pro-solid-svg-icons";

import { Button } from "~/components/ui";
import { BaseDialog } from "~/components/ui/BaseDialog";

import { ArtStyleNames, SubPanelNames } from "./enums";
import {
  generateRandomTextPositive,
  generateRandomTextNegative,
  AIStylizeProps,
  initialValues as initialAIStylizeProps,
} from "./utilities";

import { SubPanelBasic } from "./SubPanelBasic";
import { SubPanelAdvance } from "./SubPanelAdvance";

type DialogStates = AIStylizeProps & {
  panelState: SubPanelNames;
  isPosPromptUserInput: boolean;
  isNegPromptUserInput: boolean;
};
const initialDialogStates = {
  panelState: SubPanelNames.BASIC,
  isPosPromptUserInput: false,
  isNegPromptUserInput: false,
};
export const DialogAiStylize = ({
  isOpen,
  closeCallback,
  onRequestAIStylize,
}: {
  isOpen: boolean;
  closeCallback: () => void;
  onRequestAIStylize: (data: AIStylizeProps) => void;
}) => {
  const [state, setState] = useState<DialogStates>({
    ...initialAIStylizeProps,
    ...initialDialogStates,
  });
  const { panelState, ...aiStylizeProps } = state;
  const { selectedArtStyle, positivePrompt, negativePrompt } = aiStylizeProps;

  function handleGenerate() {
    onRequestAIStylize(aiStylizeProps);
    closeCallback();
  }
  const onChangePanel = useCallback((newP: SubPanelNames) => {
    setState((curr) => ({ ...curr, panelState: newP }));
  }, []);
  const setStylizeOptions = useCallback((newOptions: Partial<DialogStates>) => {
    setState((curr) => {
      if (newOptions.selectedArtStyle) {
        const promptOptions = {
          positivePrompt: curr.isPosPromptUserInput
            ? curr.positivePrompt
            : generateRandomTextPositive(newOptions.selectedArtStyle),
          negativePrompt: curr.isNegPromptUserInput
            ? curr.negativePrompt
            : generateRandomTextNegative(newOptions.selectedArtStyle),
        };
        return { ...curr, ...newOptions, ...promptOptions };
      }
      return { ...curr, ...newOptions };
    });
  }, []);
  const onSelectedArtStyle = useCallback((newArtstyle: ArtStyleNames) => {
    setStylizeOptions({
      selectedArtStyle: newArtstyle,
    });
  }, []);
  const onChangeNegativePrompt = useCallback(
    (newPrompt: string, isUserInput?: boolean) => {
      setStylizeOptions({
        negativePrompt: newPrompt,
        isNegPromptUserInput: isUserInput,
      });
    },
    [],
  );
  const onChangePositivePrompt = useCallback(
    (newPrompt: string, isUserInput?: boolean) => {
      setStylizeOptions({
        positivePrompt: newPrompt,
        isPosPromptUserInput: isUserInput,
      });
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setState({
        ...initialAIStylizeProps,
        ...initialDialogStates,
      });
    }
  }, [isOpen]);

  return (
    <BaseDialog
      isOpen={isOpen}
      onClose={closeCallback}
      className="min-h-[calc(100vh-300px)] max-w-7xl"
    >
      <DialogTitle className="text-3xl font-bold">
        Use AI to Stylize
      </DialogTitle>

      {panelState === SubPanelNames.BASIC && (
        <SubPanelBasic
          selectedArtStyle={selectedArtStyle}
          positivePrompt={positivePrompt}
          negativePrompt={negativePrompt}
          onSelectedArtStyle={onSelectedArtStyle}
          onChangeNegativePrompt={onChangeNegativePrompt}
          onChangePositivePrompt={onChangePositivePrompt}
          onChangePanel={onChangePanel}
        />
      )}
      {panelState === SubPanelNames.ADVANCED && (
        <SubPanelAdvance
          aiStylizeProps={aiStylizeProps}
          onStylizeOptionsChanged={setStylizeOptions}
          onChangePanel={onChangePanel}
        />
      )}
      <div className="flex w-full justify-end gap-2">
        <Button onClick={closeCallback} variant="secondary">
          Cancel
        </Button>

        <Button
          className="hover:animate-pulse"
          icon={faWandSparkles}
          onClick={handleGenerate}
        >
          Generate
        </Button>
      </div>
    </BaseDialog>
  );
};
