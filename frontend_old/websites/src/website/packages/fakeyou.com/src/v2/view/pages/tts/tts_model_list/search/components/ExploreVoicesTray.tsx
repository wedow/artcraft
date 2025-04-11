import React from "react";
import { faEraser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LanguageOptions } from "../filters/LanguageOptions";
import { TtsCategoryType } from "../../../../../../../AppWrapper";
import { TtsModelListItem } from "@storyteller/components/src/api/tts/ListTtsModels";
import { CategoryOptions } from "../filters/CategoryOptions";
import { useLocalize } from "hooks";

interface Props {
  allTtsCategories: TtsCategoryType[];
  allTtsModels: TtsModelListItem[];

  allTtsCategoriesByTokenMap: Map<string, TtsCategoryType>;
  allTtsModelsByTokenMap: Map<string, TtsModelListItem>;
  ttsModelsByCategoryToken: Map<string, Set<TtsModelListItem>>;

  dropdownCategories: TtsCategoryType[][];
  setDropdownCategories: (dropdownCategories: TtsCategoryType[][]) => void;

  selectedCategories: TtsCategoryType[];
  setSelectedCategories: (selectedCategories: TtsCategoryType[]) => void;

  maybeSelectedTtsModel?: TtsModelListItem;
  setMaybeSelectedTtsModel: (maybeSelectedTtsModel: TtsModelListItem) => void;

  selectedTtsLanguageScope: string;
  setSelectedTtsLanguageScope: (selectedTtsLanguageScope: string) => void;
}

export function ExploreVoicesTray(props: Props) {
  const { t } = useLocalize("TtsModelListPage");
  const {
    allTtsCategories,
    allTtsCategoriesByTokenMap,
    ttsModelsByCategoryToken,
    dropdownCategories,
    setDropdownCategories,
    selectedCategories,
    setSelectedCategories,
    maybeSelectedTtsModel,
  } = props;

  const doChangeCategory = (level: number, maybeToken: string) => {
    // Slice off all the irrelevant child category choices, then append new choice.
    let newCategorySelections = selectedCategories.slice(0, level);

    // And the dropdowns themselves
    let newDropdownCategories = dropdownCategories.slice(0, level + 1);

    let category = allTtsCategoriesByTokenMap.get(maybeToken);
    if (!!category) {
      newCategorySelections.push(category);
    }

    setSelectedCategories(newCategorySelections);

    const newSubcategories = allTtsCategories.filter((category) => {
      return category.maybe_super_category_token === maybeToken;
    });

    newDropdownCategories.push(newSubcategories);
    setDropdownCategories(newDropdownCategories);

    // We might have switched into a category without our selected TTS model.
    // If so, pick a new TTS model.
    let maybeNewModel = undefined;
    const availableModelsForCategory = ttsModelsByCategoryToken.get(maybeToken);
    if (!!availableModelsForCategory && !!maybeSelectedTtsModel) {
      const modelValid = availableModelsForCategory.has(maybeSelectedTtsModel);
      if (!modelValid) {
        maybeNewModel = Array.from(availableModelsForCategory)[0];
      }
    }
    if (!!maybeNewModel) {
      props.setMaybeSelectedTtsModel(maybeNewModel);
    }
  };

  const handleChangeCategory = (level: number, maybeCategoryToken?: string) => {
    if (!maybeCategoryToken) {
      return true;
    }
    doChangeCategory(level, maybeCategoryToken);
    return true;
  };

  return (
    <div>
      <div className="row gx-3 gy-3">
        <div className="col-12 col-lg-3 input-icon-search">
          <label className="sub-title">{t("ttsExploreLanguageLabel")}</label>
          <LanguageOptions
            selectedTtsLanguageScope={props.selectedTtsLanguageScope}
            setSelectedTtsLanguageScope={props.setSelectedTtsLanguageScope}
          />
        </div>

        <div className="col-12 col-md-12 col-lg-9 input-icon-search">
          <div className="d-flex align-items-start">
            <label className="sub-title flex-grow-1">
              {t("ttsExploreCategoryLabel")}
            </label>
            <button
              className="ms-3 fw-medium btn-link"
              onClick={() => {
                handleChangeCategory(0, "*");
              }}
              type="button"
            >
              <FontAwesomeIcon icon={faEraser} className="me-2" />
              {t("ttsExploreButtonClearFilter")}
            </button>
          </div>

          <CategoryOptions
            allTtsCategories={props.allTtsCategories}
            allTtsModels={props.allTtsModels}
            allTtsCategoriesByTokenMap={props.allTtsCategoriesByTokenMap}
            allTtsModelsByTokenMap={props.allTtsModelsByTokenMap}
            ttsModelsByCategoryToken={props.ttsModelsByCategoryToken}
            dropdownCategories={props.dropdownCategories}
            setDropdownCategories={props.setDropdownCategories}
            selectedCategories={props.selectedCategories}
            setSelectedCategories={props.setSelectedCategories}
            maybeSelectedTtsModel={props.maybeSelectedTtsModel}
            setMaybeSelectedTtsModel={props.setMaybeSelectedTtsModel}
            handleChangeCategory={handleChangeCategory}
            selectedTtsLanguageScope={props.selectedTtsLanguageScope}
          />
        </div>
      </div>
    </div>
  );
}
