import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TtsModelListItem } from "@storyteller/components/src/api/tts/ListTtsModels";
import { TtsCategoryType } from "../../../../../../../AppWrapper";
import Select, { createFilter } from "react-select";
import { SearchFieldClass } from "./SearchFieldClass";
import { FastReactSelectOption } from "../../../../../_common/react_select/FastReactSelectOption";
import { Analytics } from "../../../../../../../common/Analytics";
import { FixedSingleValueSelectOption } from "../../../../../_common/react_select/FixedSingleValueSelectOption";
import { faMicrophone } from "@fortawesome/pro-solid-svg-icons";

interface Props {
  allTtsCategories: TtsCategoryType[];
  allTtsModels: TtsModelListItem[];

  allTtsCategoriesByTokenMap: Map<string, TtsCategoryType>;
  allTtsModelsByTokenMap: Map<string, TtsModelListItem>;
  ttsModelsByCategoryToken: Map<string, Set<TtsModelListItem>>;

  dropdownCategories: TtsCategoryType[][];
  selectedCategories: TtsCategoryType[];

  maybeSelectedTtsModel?: TtsModelListItem;
  setMaybeSelectedTtsModel: (maybeSelectedTtsModel: TtsModelListItem) => void;

  selectedTtsLanguageScope: string;

  isExploreTrayOpen: boolean;
}

export function ScopedVoiceModelOptions(props: Props) {
  const {
    allTtsModels,
    ttsModelsByCategoryToken,
    selectedCategories,
    maybeSelectedTtsModel,
  } = props;

  //const { t } = useTranslation();

  const handleChange = (option: any, actionMeta: any) => {
    const ttsModelToken = option?.value;
    const maybeNewTtsModel = props.allTtsModelsByTokenMap.get(ttsModelToken);
    if (maybeNewTtsModel !== undefined) {
      props.setMaybeSelectedTtsModel(maybeNewTtsModel);
    }
  };

  const leafiestCategory = selectedCategories[selectedCategories.length - 1];

  let leafiestCategoryModels: Array<TtsModelListItem> = [];

  if (leafiestCategory !== undefined) {
    leafiestCategoryModels = Array.from(
      ttsModelsByCategoryToken.get(leafiestCategory.category_token) || new Set()
    );
  } else {
    leafiestCategoryModels = Array.from(new Set(allTtsModels));
  }

  interface DropdownOption {
    label: string;
    value: string;
    creatorName?: string;
    modelType?: string;
  }

  let options: DropdownOption[] = leafiestCategoryModels
    .filter(ttsModel => {
      // Scope to currently selected language
      if (props.selectedTtsLanguageScope === "*") {
        return true; // NB: Sentinel value of "*" means all languages.
      }
      return (
        ttsModel.ietf_primary_language_subtag === props.selectedTtsLanguageScope
      );
    })
    .map(ttsModel => {
      return {
        label: ttsModel.title,
        value: ttsModel.model_token,
        creatorName: ttsModel.creator_display_name,
        modelType: ttsModel.tts_model_type,
      };
    });

  let selectedOption = options.find(
    option => option.value === maybeSelectedTtsModel?.model_token
  );

  if (selectedOption === undefined && options.length > 0) {
    // NB: We shouldn't select the first item in the list since that won't update the currently
    // selected model. If the user were to close the dialogue, they'd think they had picked a voice,
    // when in reality no state would have changed. By forcing the user to choose, the user will set
    // the state appropriately.
    selectedOption = {
      label: "Select voice...",
      value: "*",
      creatorName: undefined,
      modelType: undefined,
    };
  }

  let isLoading = false;

  if (props.allTtsModels.length === 0) {
    // NB: react-select will cache values, even across different instances (!!!)
    // This can cause confusion when initializing a select instance before the data
    // is loaded, and the select will never update to show the new data.
    // The proper way to change voices after load from a placeholder "Loading..."
    // label is to use controlled props / value as is done here:
    isLoading = true;
    selectedOption = {
      label: "Loading...",
      value: "*",
      creatorName: undefined,
      modelType: undefined,
    };
  } else if (options.length === 0) {
    // NB: Perhaps the user has refined their search to be too narrow (langauge + category)
    selectedOption = {
      label: "No results (remove some filters)",
      value: "*",
      creatorName: undefined,
      modelType: undefined,
    };
  }

  const numberVoices = options.length;

  const canSearchVoices =
    !props.isExploreTrayOpen || // Always allow search when try is closed
    numberVoices > 100 || // Always allow search when there are over 100 voices
    window.innerWidth >= 1000; // Always allow search when on desktop

  let select;

  // Function to build the options themselves, so we can introduce extra elements.
  const formatOptionLabel = (
    data: DropdownOption,
    formatOptionLabelMeta: any
  ) => {
    let creatorName = <></>;
    if (data.creatorName !== undefined) {
      creatorName = <span className="opacity-50"> — {data.creatorName}</span>;
    }
    let modelType = <></>;
    if (data.modelType !== undefined) {
      if (data.modelType === "tacotron2") {
        modelType = (
          <span className="badge-model badge-model-tt2 ms-2">TT2</span>
        );
      }
    }
    return (
      <div>
        {data.label}
        {modelType}
        {creatorName}
      </div>
    );
  };

  // TODO: Cleanup

  if (canSearchVoices) {
    select = (
      <Select
        value={selectedOption} // Controlled components use "value" instead of "defaultValue".
        options={options}
        classNames={SearchFieldClass}
        onChange={handleChange}
        onMenuOpen={() => {
          Analytics.ttsOpenPrimaryVoiceSelectMenu();
        }}
        isLoading={isLoading}
        isSearchable={true}
        // NB: The following settings improve upon performance.
        // See: https://github.com/JedWatson/react-select/issues/3128
        filterOption={createFilter({ ignoreAccents: false })}
        components={
          {
            SingleValue: FixedSingleValueSelectOption,
            Option: FastReactSelectOption,
          } as any
        }
        formatOptionLabel={formatOptionLabel}
      />
    );
  } else {
    select = (
      <Select
        value={selectedOption}
        options={options}
        classNames={SearchFieldClass}
        onChange={handleChange}
        onMenuOpen={() => {
          Analytics.ttsOpenScopedVoiceSelectMenu();
        }}
        isLoading={isLoading}
        // On mobile, we don't want the onscreen keyboard to take up half the UI.
        autoFocus={false}
        isSearchable={false}
        // NB: The following settings improve upon performance.
        // See: https://github.com/JedWatson/react-select/issues/3128
        filterOption={createFilter({ ignoreAccents: false })}
        components={{ Option: FastReactSelectOption } as any}
        formatOptionLabel={formatOptionLabel}
      />
    );
  }

  return (
    <>
      <div className="col">
        <div className="input-icon-search">
          <span className="form-control-feedback">
            <FontAwesomeIcon icon={faMicrophone} />
          </span>

          {select}
        </div>
      </div>
    </>
  );
}
