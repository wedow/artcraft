import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightLong, faTags } from "@fortawesome/free-solid-svg-icons";
import { TtsModelListItem } from "@storyteller/components/src/api/tts/ListTtsModels";
import { TtsCategoryType } from "../../../../../../../AppWrapper";
//import { useTranslation } from "react-i18next";
import Select from "react-select";
import { SearchFieldClass } from "../components/SearchFieldClass";
import { Analytics } from "../../../../../../../common/Analytics";
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

  handleChangeCategory: (level: number, maybeToken?: string) => void;

  selectedTtsLanguageScope: string;
}

export function CategoryOptions(props: Props) {
  const { t } = useLocalize("TtsModelListPage");
  const {
    ttsModelsByCategoryToken,
    dropdownCategories,
    selectedCategories,
    handleChangeCategory,
  } = props;

  //const { t } = useTranslation();

  let categoryDropdowns = buildDropdowns(
    t,
    dropdownCategories,
    selectedCategories,
    ttsModelsByCategoryToken,
    handleChangeCategory
  );

  const CATEGORY_SEPARATOR = (
    <div className="d-none d-md-flex align-items-center">
      <FontAwesomeIcon icon={faArrowRightLong} className="fs-6 opacity-75" />
    </div>
  );

  let categoryDropdownsWithSeparators = [];
  for (let i = 0; i < categoryDropdowns.length; i++) {
    categoryDropdownsWithSeparators.push(categoryDropdowns[i]);
    if (i < categoryDropdowns.length - 1) {
      categoryDropdownsWithSeparators.push(CATEGORY_SEPARATOR);
    }
  }

  return (
    <>
      <div className="d-flex flex-column flex-md-row gap-2">
        {categoryDropdownsWithSeparators}
      </div>
    </>
  );
}

// ========= Build dropdowns ========

function buildDropdowns(
  t: (key: string) => string,
  dropdownCategories: TtsCategoryType[][],
  selectedCategories: TtsCategoryType[],
  ttsModelsByCategoryToken: Map<string, Set<TtsModelListItem>>,
  handleChangeCategory: (i: number, categoryToken?: string) => void
) {
  if (dropdownCategories.length === 0 || ttsModelsByCategoryToken.size === 0) {
    // While the XHR requests are still completing, we may have nothing to build.
    // It's easier to return a fully disabled "loading" <Select /> component.
    return [
      <div className="w-100">
        <span className="form-control-feedback">
          <FontAwesomeIcon icon={faTags} />
        </span>
        <Select
          isLoading={true}
          options={[]}
          inputValue={"Loading..."}
          classNames={SearchFieldClass}
          className={"w-100"}
        />
      </div>,
    ];
  }

  let categoryDropdowns = [];

  for (let i = 0; i < dropdownCategories.length; i++) {
    const currentDropdownCategories = dropdownCategories[i];
    const selectedCategory = selectedCategories[i];

    let defaultName = i === 0 ? "All Voices" : "Select...";

    let dropdownOptions = [];
    dropdownOptions.push(
      <option key={`option-${i}-*`} value="*">
        {defaultName}
      </option>
    );

    // TODO(bt, 2023-01-18): Clean this up

    // Transform into "react-select" library compatible options
    const options = currentDropdownCategories
      .filter((category) => {
        // If there are no models at the leaves, skip the category
        const models = ttsModelsByCategoryToken.get(category.category_token);
        return !(models === undefined || models.size === 0);
      })
      .map((category) => {
        return {
          value: category.category_token,
          label: category.name_for_dropdown,
        };
      });

    currentDropdownCategories.forEach((category) => {
      const models = ttsModelsByCategoryToken.get(category.category_token);
      if (models === undefined || models.size === 0) {
        return; // If there are no models at the leaves, skip
      }
      dropdownOptions.push(
        <option
          key={`option-${i}-${category.category_token}`}
          value={category.category_token}
        >
          {category.name_for_dropdown}
        </option>
      );
    });

    let selectedCategoryOption = undefined;
    if (selectedCategory !== undefined) {
      selectedCategoryOption = {
        value: selectedCategory.category_token,
        label: selectedCategory.name_for_dropdown,
      };
    }

    if (dropdownOptions.length <= 1) {
      // We've run out of subcategories. (1 == "Select...")
      // No sense trying to build more.
      break;
    }

    let selectProps: any = {
      options: options,
      classNames: SearchFieldClass,
      className: "w-100",
      autoFocus: false, // On mobile, we don't want the onscreen keyboard to take up half the UI.
      isSearchable: false, // On mobile, we don't want the onscreen keyboard to take up half the UI.
      onMenuOpen: () => {
        Analytics.ttsOpenCategorySelectMenu();
      },
      onChange: (option: any) => handleChangeCategory(i, option?.value),
    };

    if (selectedCategoryOption === undefined) {
      // NB(bt, 2023-01-19): I'm not sure why we're having to do this to clear categories.
      // If I had more time to spend with this library, I might have a better solution than this hack.
      selectProps["value"] = {
        value: "*",
        label: t("ttsExploreCategoryOptionText"),
      };
    } else {
      selectProps["value"] = selectedCategoryOption;
    }

    categoryDropdowns.push(
      <React.Fragment key={`categoryDropdown-${i}`}>
        <div className="w-100">
          <span className="form-control-feedback">
            <FontAwesomeIcon icon={faTags} />
          </span>
          <Select {...selectProps} />
        </div>
      </React.Fragment>
    );
  }

  return categoryDropdowns;
}
