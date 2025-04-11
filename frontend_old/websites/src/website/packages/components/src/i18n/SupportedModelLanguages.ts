
// Default langague
export const DEFAULT_MODEL_LANGUAGE = 'English';

// These are set in the backend as constants
export const SUPPORTED_MODEL_LANGUAGE_TAG_TO_FULL : Map<string, string> = new Map([
  ["en", "English"],
  ["en-AU", "English (AUS)"],
  ["en-UK", "English (UK)"],
  ["en-US", "English (US)"],
  ["ar", "Arabic (عربي)"],
  ["de", "German (Deutsch)"],
  ["de-AT", "German (Österreichisches Deutsch)"],
  ["de-CH", "German (Schweizer Standarddeutsch)"],
  ["de-LI", "German (Deutsch Liechtenstein)"],
  ["de-LU", "German (Deutsch Luxemburg)"],
  ["es", "Spanish (Español)"],
  ["es-419", "Spanish (Español Latinoamerica)"],
  ["es-ES", "Spanish (Español España)"],
  ["es-MX", "Spanish (Español México)"],
  ["tr", "Turkish (Türk)"],
  ["fr", "French (Français)"],
  ["fr-CA", "French (Français Canadien)"],
  ["it", "Italian (Italiano)"],
  ["it-CH", "Italian (Italiano Svizzero )"],
  ["pt", "Portuguese (Portugués)"],
  ["pt-BR", "Portuguese (Português Brasileiro)"],
]);

export function LanguageCodeToDescription(languageCode: string | undefined) : string | undefined {
  if (languageCode === undefined) {
    return undefined;
  }
  return SUPPORTED_MODEL_LANGUAGE_TAG_TO_FULL.get(languageCode);
}

export function LanguageCodeToDescriptionWithDefault(languageCode: string | undefined) : string | undefined {
  return LanguageCodeToDescription(languageCode) ||  DEFAULT_MODEL_LANGUAGE;
}
