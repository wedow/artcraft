import { faMagicWandSparkles, faRectangle, faRectangleVertical, faRectangleWide, faSquare, IconDefinition } from "@fortawesome/pro-regular-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { PopoverItem, PopoverMenu } from "libs/components/popover/src/lib/popover"
import Tooltip from "libs/components/tooltip/src/lib/tooltip"
import { ImageModel } from "libs/model-list/src/lib/classes/ImageModel"
import { CommonAspectRatio } from "libs/model-list/src/lib/classes/properties/CommonAspectRatio"


interface AspectRatioPickerProps {
  model: ImageModel,
  currentAspectRatio?: CommonAspectRatio,
  handleCommonAspectRatioSelect: (selected: CommonAspectRatio) => void;
  //model: ImageModel | VideoModel
}

/**
 * Stateless component.
 * 
 * Picker for "common aspect ratios", the new data structure Tauri accepts for 
 * all image and video models (Note: this is not fully rolled out yet. Some/most 
 * models may still use the old format.)
 * 
 * @param model - currently selected model
 * @param currentAspectRatio - currently selected aspect ratio
 * @param handleCommonAspectRatioSelect - callback when an aspect ratio is selected
 */
export const AspectRatioPicker = ({
  model,
  currentAspectRatio,
  handleCommonAspectRatioSelect,
}: AspectRatioPickerProps) => {

  const useAspectRatio = currentAspectRatio ?? model.defaultAspectRatio ?? undefined;

  console.log("aspect - currentAspectRatio:", currentAspectRatio);
  console.log("aspect - useAspectRatio:", useAspectRatio);

  const getCurrentResolutionIcon = () : IconDefinition => {
    if (!useAspectRatio) {
      return faSquare;
    }
    return getAspectRatioIcon(useAspectRatio);
  }

  const handleSelectAdapter = (item: PopoverItem) => {
    const ratio = popOverLabelToAspectRatio(item.label, model);
    handleCommonAspectRatioSelect(ratio);
  }

  let aspectRatioList : PopoverItem[] = [];

  model.aspectRatios?.forEach((ratio: CommonAspectRatio) => {
    aspectRatioList.push({
      label: getAspectRatioTextLabel(ratio),
      selected: useAspectRatio === ratio,
      description: `foo ${ratio}`,
      icon: <FontAwesomeIcon icon={getAspectRatioIcon(ratio)} className="h-4 w-4" />,
    });
  });

  return (
    <>
      <Tooltip
        content="Aspect Ratio"
        position="top"
        className="z-50"
        closeOnClick={true}
      >
        <PopoverMenu
          items={aspectRatioList}
          onSelect={handleSelectAdapter}
          mode="toggle"
          panelTitle="Aspect Ratio"
          showIconsInList
          triggerIcon={
            <FontAwesomeIcon
              icon={getCurrentResolutionIcon()}
              className="h-4 w-4"
            />
          }
        />
      </Tooltip>
    </>
  )
}


const getAspectRatioIcon = (aspectRatio: CommonAspectRatio) : IconDefinition => {
  switch (aspectRatio) {
    case CommonAspectRatio.Auto:
      return faMagicWandSparkles;
    case CommonAspectRatio.Square:
      return faSquare;

    case CommonAspectRatio.WideFiveByFour:
    case CommonAspectRatio.WideFourByThree:
    case CommonAspectRatio.WideThreeByTwo:
      return faRectangle;
    case CommonAspectRatio.WideSixteenByNine:
    case CommonAspectRatio.WideTwentyOneByNine:
      return faRectangleWide;

    // Tall
    case CommonAspectRatio.TallFourByFive:
    case CommonAspectRatio.TallThreeByFour:
    case CommonAspectRatio.TallTwoByThree:
      return faRectangleVertical;
    case CommonAspectRatio.TallNineBySixteen:
    case CommonAspectRatio.TallNineByTwentyOne:
      return faRectangleVertical; // TODO: New FontAwesome 7 has "Tall".

    default:
      return faSquare; // Fail open-ish
  }
}

const getAspectRatioTextLabel = (aspectRatio: CommonAspectRatio) : string => {
  switch (aspectRatio) {
    case CommonAspectRatio.Auto:
      return "Auto";
    case CommonAspectRatio.Square:
      return "Square";

    // Wide
    case CommonAspectRatio.WideFiveByFour:
      return "5:4";
    case CommonAspectRatio.WideFourByThree:
      return "4:3";
    case CommonAspectRatio.WideThreeByTwo:
      return "3:2";
    case CommonAspectRatio.WideSixteenByNine:
      return "16:9";
    case CommonAspectRatio.WideTwentyOneByNine:
      return "21:9";

    // Tall
    case CommonAspectRatio.TallFourByFive:
      return "4:5";
    case CommonAspectRatio.TallThreeByFour:
      return "3:4";
    case CommonAspectRatio.TallTwoByThree:
      return "2:3";
    case CommonAspectRatio.TallNineBySixteen:
      return "9:16";
    case CommonAspectRatio.TallNineByTwentyOne:
      return "9:21";

    default:
      return "Square"; // Fail open-ish
  }
}

// Note: We only need this to deal with turning PopOverItems back into typesafe aspect ratios
const popOverLabelToAspectRatio = (label: string, model: ImageModel): CommonAspectRatio => {
  switch (label) {
    case "Auto": return CommonAspectRatio.Auto;
    case "Square": return CommonAspectRatio.Square;
    case "5:4": return CommonAspectRatio.WideFiveByFour;
    case "4:3": return CommonAspectRatio.WideFourByThree;
    case "3:2": return CommonAspectRatio.WideThreeByTwo;
    case "16:9": return CommonAspectRatio.WideSixteenByNine;
    case "21:9": return CommonAspectRatio.WideTwentyOneByNine;
    case "4:5": return CommonAspectRatio.TallFourByFive;
    case "3:4": return CommonAspectRatio.TallThreeByFour;
    case "2:3": return CommonAspectRatio.TallTwoByThree;
    case "9:16": return CommonAspectRatio.TallNineBySixteen;
    case "9:21": return CommonAspectRatio.TallNineByTwentyOne;
  }
  // If we can't find it, return the model's default aspect ratio or Square as fallback
  return model.defaultAspectRatio || CommonAspectRatio.Square;
}
