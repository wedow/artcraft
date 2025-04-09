import { faChevronLeft } from "@fortawesome/pro-solid-svg-icons";
import { StyleOptionSwitches } from "./StyleOptionSwitches";
import { AIStylizeProps } from "../utilities";
import { StyleStrengthSlider } from "./StyleStrengthSlider";
import { IPAdapter } from "./IPAdapter";
import { Button } from "~/components/ui";
import { SubPanelNames } from "../enums";

export const SubPanelAdvance = ({
  aiStylizeProps,
  onStylizeOptionsChanged,
  onChangePanel,
}: {
  aiStylizeProps: AIStylizeProps;
  onStylizeOptionsChanged: (newOptions: Partial<AIStylizeProps>) => void;
  onChangePanel: (newP: SubPanelNames) => void;
}) => {
  const {
    cinematic,
    enginePreProcessing,
    faceDetail,
    lipSync,
    upscale,
    styleStrength,
  } = aiStylizeProps;

  return (
    <div className="flex w-full grow gap-4">
      <div className="w-2/3">
        <IPAdapter
          ipaToken={aiStylizeProps.globalIpaMediaToken}
          onUploadedIPA={(newToken) =>
            onStylizeOptionsChanged({
              globalIpaMediaToken: newToken,
            })
          }
        />
      </div>
      <div className="flex w-1/3 flex-col justify-between gap-4">
        <h4>Advanced Options</h4>
        <StyleOptionSwitches
          faceDetail={faceDetail}
          upscale={upscale}
          lipSync={lipSync}
          cinematic={cinematic}
          enginePreProcessing={enginePreProcessing}
          onStylizeOptionsChanged={onStylizeOptionsChanged}
        />
        <br />
        <StyleStrengthSlider
          styleStrength={styleStrength}
          onStylizeOptionsChanged={onStylizeOptionsChanged}
        />
        <span className="grow" />
        <Button
          onClick={() => onChangePanel(SubPanelNames.BASIC)}
          variant="tertiary"
          className="w-fit self-end"
          icon={faChevronLeft}
        >
          Back to Basic Options
        </Button>
      </div>
    </div>
  );
};
