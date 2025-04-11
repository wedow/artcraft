import { WizardItem } from "~/pages/PageEnigma/Wizard/Wizard";
import { ObjectSelectionButton } from "~/pages/PageEnigma/Wizard/ObjectSelectionButton";
import { BucketConfig } from "~/api/BucketConfig";
import { MediaInfo } from "~/pages/PageEnigma/models";
import { AssetType, FilterEngineCategories, ToastTypes } from "~/enums";
import { useCallback, useEffect, useState } from "react";
import { MediaFilesApi } from "~/Classes/ApiManager";
import { addToast } from "~/signals";
import {
  backgroundWizardItems,
  currentStep,
  selectedBackground,
} from "~/pages/PageEnigma/Wizard/signals/wizard";
import { useSignals } from "@preact/signals-react/runtime";
import { BackgroundList } from "~/pages/PageEnigma/Wizard/BackgroundList";

export const Background = () => {
  useSignals();
  const item = currentStep.value as WizardItem;
  const [showList, setShowList] = useState(false);

  const responseMapping = (data: MediaInfo[]) => {
    return data
      .filter(
        (item) =>
          [
            "Sci-fi City",
            "Cherry Blossom Petals",
            "Barbie Dreamland Test",
            "Space Station",
            "graveyard_2",
            "sand tile",
            "Tiny Island",
            "dock",
          ].indexOf(item.maybe_title ?? "") > -1,
      )
      .map((item) => {
        const bucketConfig = new BucketConfig();
        const itemThumb = bucketConfig.getCdnUrl(
          item.cover_image.maybe_cover_image_public_bucket_path ?? "",
          600,
          100,
        );
        return {
          colorIndex: item.cover_image.default_cover.color_index,
          imageIndex: item.cover_image.default_cover.image_index,
          media_id: item.token,
          name: item.maybe_title ?? "Unknown",
          type: AssetType.OBJECT,
          media_type: item.media_type,
          version: 1,
          ...(item.cover_image.maybe_cover_image_public_bucket_path
            ? {
                thumbnail: itemThumb,
              }
            : {}),
        };
      });
  };

  const fetchFeaturedObjects = useCallback(async () => {
    const mediaFilesApi = new MediaFilesApi();
    const response = await mediaFilesApi.ListFeaturedMediaFiles({
      filter_engine_categories: [FilterEngineCategories.OBJECT],
    });
    if (response.success && response.data) {
      backgroundWizardItems.value = responseMapping(response.data);
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Fetching Featured Objects",
    );
  }, []);

  useEffect(() => {
    fetchFeaturedObjects();
  }, [fetchFeaturedObjects]);

  if (showList) {
    return <BackgroundList onClose={() => setShowList(false)} />;
  }
  return (
    <div>
      <div>{item.label}</div>
      <ObjectSelectionButton
        onClick={() => setShowList(true)}
        label={
          selectedBackground.value ? "Selected Background" : "Select Background"
        }
        busy={!backgroundWizardItems.value}
        imageSrc={
          selectedBackground.value?.thumbnail ??
          backgroundWizardItems.value?.[0]?.thumbnail ??
          ""
        }
      />
    </div>
  );
};
