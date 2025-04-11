export type LanguageTag =
  | "en" // English
  | "es" // Spanish
  | "fr" // French
  | "de" // German
  | "hi" // Hindi
  | "it" // Italian
  | "pt" // Portuguese
  | "tr" // Turkish
  | "ar" // Arabic
  | "ja" // Japanese
  | "id" // Indonesian
  | "ru" // Russian
  | "th" // Thai
  | "zh"; // Chinese

export const LanguageLabels: Record<LanguageTag, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  hi: "Hindi",
  it: "Italian",
  pt: "Portuguese",
  tr: "Turkish",
  ar: "Arabic",
  ja: "Japanese",
  id: "Indonesian",
  ru: "Russian",
  th: "Thai",
  zh: "Chinese",
};
