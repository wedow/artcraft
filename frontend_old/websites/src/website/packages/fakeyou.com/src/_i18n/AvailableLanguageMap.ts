import { Language } from "@storyteller/components/src/i18n/Language";

export interface AvailableLanguage {
  language: Language;
  languageCode: string;
  languageName: string;
  languageNameLocalized?: string;
  flags: string[];
  flagsMore?: string[];
  showPleaseFollowNotice: boolean;
  showBootstrapLanguageNotice: boolean;
}

export const ENGLISH_LANGUAGE: AvailableLanguage = {
  language: Language.English,
  languageCode: "en",
  languageName: "English",
  languageNameLocalized: undefined,
  flags: ["🇺🇸", "🇬🇧"],
  showPleaseFollowNotice: false,
  showBootstrapLanguageNotice: false,
};

// These are the languages the website has been *translated* into.
// This is *not* the list of TTS langauge categories.
export type AvailableLanguageKey =
  | "en"
  | "es"
  | "ar"
  | "de"
  | "fr"
  | "hi"
  | "id"
  | "it"
  | "ja"
  | "ko"
  | "pt"
  | "tr"
  | "vi"
  | "zh"
  | "th"
  | "ru"
  | "bn";
export const AVAILABLE_LANGUAGE_MAP: Record<
  AvailableLanguageKey,
  AvailableLanguage
> = {
  en: ENGLISH_LANGUAGE,
  es: {
    language: Language.Spanish,
    languageCode: "es",
    languageName: "Spanish",
    languageNameLocalized: "Español",
    flags: ["🇪🇸", "🇲🇽"],
    flagsMore: ["🇨🇴", "🇦🇷"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  ar: {
    language: Language.Arabic,
    languageCode: "ar",
    languageName: "Arabic",
    languageNameLocalized: "عربي",
    flags: ["🇦🇪", "🇸🇦"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false, // TODO
  },
  de: {
    language: Language.German,
    languageCode: "de",
    languageName: "German",
    languageNameLocalized: "Deutsch",
    flags: ["🇩🇪"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  fr: {
    language: Language.French,
    languageCode: "fr",
    languageName: "French",
    languageNameLocalized: "Français",
    flags: ["🇫🇷"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  hi: {
    language: Language.Hindi,
    languageCode: "hi",
    languageName: "Hindi",
    languageNameLocalized: "Hindi",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  id: {
    language: Language.Indonesian,
    languageCode: "id",
    languageName: "Indonesian",
    languageNameLocalized: "Indonesian",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  it: {
    language: Language.Italian,
    languageCode: "it",
    languageName: "Italian",
    languageNameLocalized: "Italiano",
    flags: ["🇮🇹"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  ja: {
    language: Language.Japanese,
    languageCode: "ja",
    languageName: "Japanese",
    languageNameLocalized: "Japanese",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  ko: {
    language: Language.Korean,
    languageCode: "ko",
    languageName: "Korean",
    languageNameLocalized: "Korean",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  pt: {
    language: Language.Portuguese,
    languageCode: "pt",
    languageName: "Portuguese",
    languageNameLocalized: "Português",
    flags: ["🇵🇹", "🇧🇷"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  tr: {
    language: Language.Turkish,
    languageCode: "tr",
    languageName: "Turkish",
    languageNameLocalized: "Türk",
    flags: ["🇹🇷"],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  vi: {
    language: Language.Vietnamese,
    languageCode: "vi",
    languageName: "Vietnamese",
    languageNameLocalized: "Vietnamese",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  zh: {
    language: Language.ChineseSimplified,
    languageCode: "zh",
    languageName: "Chinese Simplified",
    languageNameLocalized: "Chinese Simplified",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  th: {
    language: Language.Thai,
    languageCode: "th",
    languageName: "Thai",
    languageNameLocalized: "ไทย",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  ru: {
    language: Language.Russian,
    languageCode: "ru",
    languageName: "Russian",
    languageNameLocalized: "Russian",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
  bn: {
    language: Language.Bengali,
    languageCode: "bn",
    languageName: "Bengali",
    languageNameLocalized: "Bengali",
    flags: [],
    showPleaseFollowNotice: false,
    showBootstrapLanguageNotice: false,
  },
};

/// These are the languages TTS has been categorized into.
export type AvailableTtsLanguageKey =
  | "en"
  | "es"
  | "it"
  | "de"
  | "fr"
  | "pt"
  | "ar"
  | "tr";
export const AVAILABLE_TTS_LANGUAGE_CATEGORY_MAP: Record<
  AvailableTtsLanguageKey,
  AvailableLanguage
> = {
  en: AVAILABLE_LANGUAGE_MAP["en"],
  es: AVAILABLE_LANGUAGE_MAP["es"],
  ar: AVAILABLE_LANGUAGE_MAP["ar"],
  de: AVAILABLE_LANGUAGE_MAP["de"],
  fr: AVAILABLE_LANGUAGE_MAP["fr"],
  it: AVAILABLE_LANGUAGE_MAP["it"],
  pt: AVAILABLE_LANGUAGE_MAP["pt"],
  tr: AVAILABLE_LANGUAGE_MAP["tr"],

  // ... additional languages the website hasn't been translated into.
};
