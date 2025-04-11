import { useDocumentTitle } from "@storyteller/components/src/hooks/UseDocumentTitle"
import { WebsiteConfig, Website, GetWebsite } from "@storyteller/components/src/env/GetWebsite";

const FAKEYOU_DEFAULT_TITLE = "FakeYou. Deep Fake Text to Speech.";
const FAKEYOU_SUFFIX = "FakeYou";

const STORYTELLER_DEFAULT_TITLE = "Storyteller.ai - AI Film and Movie Tools";
const STORYTELLER_SUFFIX = "Storyteller.ai";

export function usePrefixedDocumentTitle(title?: string) {
  const domainConfig : WebsiteConfig = GetWebsite();

  const fixed = title === undefined ? "" : title.trim();

  let defaultTitle;
  let defaultSuffix;

  switch (domainConfig.website) {
    case Website.FakeYou:
      defaultTitle = FAKEYOU_DEFAULT_TITLE;
      defaultSuffix = FAKEYOU_SUFFIX;
      break;
    case Website.StorytellerAi:
    case Website.StorytellerStudio:
    default:
      defaultTitle = STORYTELLER_DEFAULT_TITLE;
      defaultSuffix = STORYTELLER_SUFFIX;
      break;
  }

  // NB: Choice of a vertical bar "|" separator is due to conserving pixels, which *might* matter to SEO.
  // I haven't fully investigated the veracity of this, nor the position of prefixes, suffixes, etc.
  // https://www.searchenginejournal.com/pipe-or-dash-in-title-tag/378099/#close
  const outputTitle = fixed.length === 0 ? defaultTitle : `${fixed} | ${defaultSuffix}`;
  useDocumentTitle(outputTitle);
}
