
// Friendly names for each of the text pipeline identifiers.
const TEXT_PIPELINE_NAMES : Map<string, string> = new Map([
  ["legacy_fakeyou", "Legacy FakeYou (grapheme-focused)"],
  ["english_v1", "English v1 (Arpabet)"],
]);

const TEXT_PIPELINE_NAMES_FOR_MODERATORS : Map<string, string> = new Map([
  //["legacy_vocodes", "Legacy Vocodes"],
  ["legacy_fakeyou", "Legacy FakeYou (grapheme-focused)"],
  ["english_v1", "English v1 (Arpabet)"],
  ["legacy_fakeyou_2", "Legacy Fakeyou (Old Arpabet*)"], // NB: Tricksy.
]);

export { TEXT_PIPELINE_NAMES, TEXT_PIPELINE_NAMES_FOR_MODERATORS }