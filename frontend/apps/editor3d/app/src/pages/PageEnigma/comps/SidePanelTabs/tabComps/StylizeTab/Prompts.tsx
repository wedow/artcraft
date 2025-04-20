import { ChangeEvent, useContext, useEffect } from "react";
import { Textarea } from "~/components";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faRandom,
} from "@fortawesome/pro-solid-svg-icons";
import { RandomTextsPositive } from "~/pages/PageEnigma/constants/RandomTexts";
import { promptsStore, selectedArtStyle } from "~/pages/PageEnigma/signals";
import { useSignals } from "@preact/signals-react/runtime";
import { Transition } from "@headlessui/react";
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";

export const Prompts = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);

  useEffect(() => {
    if (editorEngine === null) {
      return;
    }

    if (!promptsStore.isUserInputPositive.value) {
      const randomIndexPositive = Math.floor(
        Math.random() * RandomTextsPositive[selectedArtStyle.value].length,
      );
      const randomTextPositive =
        RandomTextsPositive[selectedArtStyle.value][randomIndexPositive];
      editorEngine.positive_prompt = randomTextPositive;
      promptsStore.textBufferPositive.value = randomTextPositive;
    }
  }, [editorEngine]);

  const onChangeHandlerNegative = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (editorEngine === null) {
      console.log("Editor is null");
      return;
    }
    promptsStore.isUserInputNegative.value = true;
    editorEngine.negative_prompt = event.target.value;
    promptsStore.textBufferNegative.value = event.target.value;
  };

  const onChangeHandlerPositive = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (editorEngine === null) {
      console.log("Editor is null");
      return;
    }
    promptsStore.isUserInputPositive.value = true;
    editorEngine.positive_prompt = event.target.value;
    promptsStore.textBufferPositive.value = event.target.value;
  };

  const generateRandomTextPositive = () => {
    const randomIndex = Math.floor(
      Math.random() * RandomTextsPositive[selectedArtStyle.value].length,
    );
    const randomText = RandomTextsPositive[selectedArtStyle.value][randomIndex];
    if (editorEngine === null) {
      console.log("Editor is null");
      return;
    }
    promptsStore.isUserInputPositive.value = false;
    editorEngine.positive_prompt = randomText;
    promptsStore.textBufferPositive.value = randomText;
  };

  return (
    <div className="flex flex-col gap-3 rounded-t-lg bg-ui-panel">
      <div className="relative w-full">
        <Textarea
          label="Enter a Prompt"
          className="w-full text-sm"
          rows={3}
          name="positive-prompt"
          placeholder="Type here to describe your scene"
          onChange={onChangeHandlerPositive}
          required
          value={promptsStore.textBufferPositive.value}
          resize="none"
        />
        <div className="absolute right-0 top-[2px]">
          <button
            className="flex items-center text-xs font-medium text-brand-primary transition-colors duration-100 hover:text-brand-primary-400"
            onClick={generateRandomTextPositive}
          >
            <FontAwesomeIcon icon={faRandom} className="me-1.5" />
            Randomize
          </button>
        </div>
      </div>
      {currentPage.value === Pages.EDIT ? (
        <>
          <Transition
            show={promptsStore.showNegativePrompt.value}
            enter="transition-all duration-200 ease-in-out"
            enterFrom="opacity-0 max-h-0"
            enterTo="opacity-100 max-h-36"
            leave="transition-all duration-200 ease-in-out"
            leaveFrom="opacity-100 max-h-36"
            leaveTo="opacity-0 max-h-0"
          >
            <div className="relative w-full">
              <Textarea
                label="Negative Prompt"
                className="w-full text-sm"
                rows={2}
                name="negative-prompt"
                placeholder="Type here to filter out the things you don't want in the scene"
                onChange={onChangeHandlerNegative}
                value={promptsStore.textBufferNegative.value}
                resize="none"
              />
            </div>
          </Transition>
          <div>
            <button
              className="flex items-center text-xs font-medium text-brand-primary transition-colors duration-100 hover:text-brand-primary-400"
              onClick={() =>
                (promptsStore.showNegativePrompt.value =
                  !promptsStore.showNegativePrompt.value)
              }
            >
              {promptsStore.showNegativePrompt.value ? "Hide" : "Show"} Negative
              Prompt
              <FontAwesomeIcon
                icon={
                  promptsStore.showNegativePrompt.value
                    ? faChevronUp
                    : faChevronDown
                }
                className="ms-1.5"
              />
            </button>
          </div>
        </>
      ) : (
        <div className="relative w-full">
          <Textarea
            label="Negative Prompt"
            className="w-full text-sm"
            rows={2}
            name="negative-prompt"
            placeholder="Type here to filter out the things you don't want in the scene"
            onChange={onChangeHandlerNegative}
            value={promptsStore.textBufferNegative.value}
            resize="none"
          />
        </div>
      )}
    </div>
  );
};
