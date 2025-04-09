import { ChangeEvent, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRandom } from "@fortawesome/pro-solid-svg-icons";

import { Textarea } from "~/components/ui";
import {
  generateRandomTextPositive,
  generateRandomTextNegative,
} from "../utilities";
import { ArtStyleNames } from "../enums";

export const Prompts = ({
  selectedArtStyle,
  positivePrompt,
  negativePrompt,
  onChangePositivePrompt,
  onChangeNegativePrompt,
}: {
  selectedArtStyle: ArtStyleNames;
  positivePrompt: string;
  negativePrompt: string;
  onChangePositivePrompt: (newPrompt: string, isUserInput?: boolean) => void;
  onChangeNegativePrompt: (newPrompt: string, isUserInput?: boolean) => void;
}) => {
  const onChangePositivePromptHandler = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChangePositivePrompt(event.target.value, true);
  };
  const onChangeNegativePromptHandler = (
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    onChangeNegativePrompt(event.target.value, true);
  };
  const generateRandomTextPositiveHandler = useCallback(() => {
    onChangePositivePrompt(generateRandomTextPositive(selectedArtStyle), false);
  }, [selectedArtStyle]);
  const generateRandomTextNegativeHandler = useCallback(() => {
    onChangeNegativePrompt(generateRandomTextNegative(selectedArtStyle), false);
  }, [selectedArtStyle]);

  return (
    <div className="flex flex-col gap-3 rounded-t-lg bg-ui-panel">
      <div className="relative w-full">
        <Textarea
          label="Enter a Prompt"
          className="w-full"
          rows={7}
          name="positive-prompt"
          placeholder="Type here to describe your scene"
          onChange={onChangePositivePromptHandler}
          required
          value={positivePrompt}
          resize="none"
        />
        <div className="absolute right-0 top-[2px]">
          <button
            className="flex items-center text-xs font-medium text-primary transition-colors duration-100 hover:text-primary-400"
            onClick={generateRandomTextPositiveHandler}
          >
            <FontAwesomeIcon icon={faRandom} className="me-1.5" />
            Randomize
          </button>
        </div>
      </div>
      <div className="relative w-full">
        <Textarea
          label="Negative Prompt"
          className="w-full"
          rows={5}
          name="negative-prompt"
          placeholder="Type here to filter out the things you don't want in the scene"
          onChange={onChangeNegativePromptHandler}
          value={negativePrompt}
          resize="none"
        />
        <div className="absolute right-0 top-[2px]">
          <button
            className="flex items-center text-xs font-medium text-primary transition-colors duration-100 hover:text-primary-400"
            onClick={generateRandomTextNegativeHandler}
          >
            <FontAwesomeIcon icon={faRandom} className="me-1.5" />
            Use Default
          </button>
        </div>
      </div>
    </div>
  );
};
