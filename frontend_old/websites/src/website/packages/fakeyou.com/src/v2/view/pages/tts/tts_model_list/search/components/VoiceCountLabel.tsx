import React from "react";
import { TtsModelListItem } from "@storyteller/components/src/api/tts/ListTtsModels";
import { TtsCategoryType } from "../../../../../../../AppWrapper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShuffle } from "@fortawesome/pro-solid-svg-icons";
import { Analytics } from "../../../../../../../common/Analytics";
import { GetRandomArrayValue } from "@storyteller/components/src/utils/GetRandomArrayValue";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { useLocalize } from "hooks";

interface Props {
  allTtsModels: TtsModelListItem[];
  ttsModelsByCategoryToken: Map<string, Set<TtsModelListItem>>;
  selectedCategories: TtsCategoryType[];
  selectedTtsLanguageScope: string;
  setMaybeSelectedTtsModel: (maybeSelectedTtsModel: TtsModelListItem) => void;
}

// NB/TODO: This duplicates the work of a sister component, but it was the fastest way
// to hack this in without passing callbacks around or moving calculation higher up the
// component tree.

export function VoiceCountLabel(props: Props) {
  const { t } = useLocalize("TtsModelListPage");
  const { allTtsModels, ttsModelsByCategoryToken, selectedCategories } = props;

  const leafiestCategory = selectedCategories[selectedCategories.length - 1];

  let leafiestCategoryModels: Array<TtsModelListItem> = [];

  if (leafiestCategory !== undefined) {
    leafiestCategoryModels = Array.from(
      ttsModelsByCategoryToken.get(leafiestCategory.category_token) || new Set()
    );
  } else {
    leafiestCategoryModels = Array.from(new Set(allTtsModels));
  }

  let possibleVoices = leafiestCategoryModels.filter((ttsModel) => {
    // Scope to currently selected language
    if (props.selectedTtsLanguageScope === "*") {
      return true; // NB: Sentinel value of "*" means all languages.
    }
    return (
      ttsModel.ietf_primary_language_subtag === props.selectedTtsLanguageScope
    );
  });

  const selectRandomVoice = () => {
    let randomVoice = undefined;
    for (let i = 0; i < 10; i++) {
      // We're going to try to find a *good* voice.
      randomVoice = GetRandomArrayValue(possibleVoices);
      if (
        randomVoice.user_ratings.positive_count >
        randomVoice.user_ratings.negative_count
      ) {
        break; // First "mostly good" voice is good.
      }
      if (i % 3 === 2 && randomVoice.user_ratings.total_count === 0) {
        break; // Sometimes we'll return a voice that hasn't been rated.
      }
    }
    if (randomVoice !== undefined) {
      props.setMaybeSelectedTtsModel(randomVoice);
    }
  };

  const voiceCount = possibleVoices.length;

  return (
    <>
      <div className="d-flex gap-2">
        <label className="sub-title">
          {t("ttsVoiceLabel", { 0: voiceCount })}
          <Tippy
            content={t("ttsButtonRandom")}
            hideOnClick
            placement="top"
            theme="fakeyou"
            arrow={false}
          >
            <button
              onClick={() => {
                Analytics.ttsClickRandomVoice();
                selectRandomVoice();
              }}
              className="btn-link pt-0 ps-2 pe-0"
              type="button"
            >
              <FontAwesomeIcon icon={faShuffle} />
            </button>
          </Tippy>
        </label>
      </div>
    </>
  );
}
