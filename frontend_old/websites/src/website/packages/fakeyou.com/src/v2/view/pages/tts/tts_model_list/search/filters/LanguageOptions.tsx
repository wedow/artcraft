import React from "react";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from "react-select";
import { SearchFieldClass } from "../components/SearchFieldClass";
import { AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP } from "../../../../../../../_i18n/AvailableLanguageMap";
import { Analytics } from "../../../../../../../common/Analytics";
import { useLocalize } from "hooks";

interface Props {
  selectedTtsLanguageScope: string;
  setSelectedTtsLanguageScope: (selectedTtsLanguageScope: string) => void;
}

export function LanguageOptions(props: Props) {
  const { t } = useLocalize("TtsModelListPage");
  const handleChange = (option: any, actionMeta: any) => {
    props.setSelectedTtsLanguageScope(option.value);
  };

  let languageOptions = Object.entries(AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP).map(
    ([languageCode, language]) => {
      let label = `${language.languageName}`;

      if (language.languageNameLocalized !== undefined) {
        label = `${language.languageNameLocalized} / ${label}`;
      }

      if (language.flags.length > 0) {
        label += ` ${language.flags.join(" ")}`;
      }

      return {
        value: languageCode,
        label: label,
      };
    }
  );

  languageOptions = [
    {
      label: `${t("ttsExploreLanguageOptionText")}`,
      value: "*",
    },
    ...languageOptions,
  ];

  const currentValue =
    languageOptions.find((option) => {
      return option.value === props.selectedTtsLanguageScope;
    }) || languageOptions[0];

  return (
    <div>
      <span className="form-control-feedback">
        <FontAwesomeIcon icon={faGlobe} />
      </span>
      <Select
        value={currentValue}
        options={languageOptions}
        classNames={SearchFieldClass}
        isSearchable={false}
        onChange={handleChange}
        onMenuOpen={() => {
          Analytics.ttsOpenCategorySelectMenu();
        }}
      />
    </div>
  );
}
