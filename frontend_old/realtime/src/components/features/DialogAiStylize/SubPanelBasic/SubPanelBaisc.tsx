import { faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ArtStyleSelector } from "./ArtStyleSelector";
import { Prompts } from "./Prompts";

import { Button } from "~/components/ui";
import { ArtStyleNames, SubPanelNames } from "../enums";

export const SubPanelBasic = ({
  selectedArtStyle,
  positivePrompt,
  negativePrompt,
  onSelectedArtStyle,
  onChangePositivePrompt,
  onChangeNegativePrompt,
  onChangePanel,
}: {
  selectedArtStyle: ArtStyleNames;
  positivePrompt: string;
  negativePrompt: string;
  onSelectedArtStyle: (artStyle: ArtStyleNames) => void;
  onChangePositivePrompt: (newPrompt: string, isUserInput?: boolean) => void;
  onChangeNegativePrompt: (newPrompt: string, isUserInput?: boolean) => void;
  onChangePanel: (newP: SubPanelNames) => void;
}) => {
  return (
    <div className="flex w-full grow gap-4">
      <div className="flex w-2/3 flex-col">
        <h4 className="mb-1 font-semibold">Pick a Style</h4>
        <ArtStyleSelector
          onSelectedArtStyle={onSelectedArtStyle}
          selectedArtStyle={selectedArtStyle}
        />
      </div>
      <div className="flex w-1/3 flex-col justify-between">
        <Prompts
          selectedArtStyle={selectedArtStyle}
          positivePrompt={positivePrompt}
          negativePrompt={negativePrompt}
          onChangePositivePrompt={onChangePositivePrompt}
          onChangeNegativePrompt={onChangeNegativePrompt}
        />
        <span className="grow" />
        <Button
          onClick={() => onChangePanel(SubPanelNames.ADVANCED)}
          variant="tertiary"
          className="w-fit self-end"
        >
          Advanced Options
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
      </div>
    </div>
  );
};
