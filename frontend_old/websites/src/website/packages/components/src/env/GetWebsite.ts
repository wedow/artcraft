export enum Website {
  FakeYou,
  StorytellerAi,
  StorytellerStudio,
}

export interface WebsiteConfig {
  // Which website we're on
  website: Website;

  // Rooted link to the logo.
  logo: string;

  // When the title needs a suffix or prefix, use this.
  titlePart: string;

  // Link to the website.
  link: string;
}

export const WEBSITE: Record<string, WebsiteConfig> = {
  storyteller: {
    website: Website.StorytellerAi,
    logo: "/fakeyou/Storyteller-Logo-1.png",
    titlePart: "Storyteller AI",
    link: "https://storyteller.ai",
  },
  storyteller_studio: {
    website: Website.StorytellerStudio,
    logo: "/fakeyou/Storyteller-Logo-1.png",
    titlePart: "Storyteller Studio",
    link: "https://studio.storyteller.ai",
  },
  fakeyou: {
    website: Website.FakeYou,
    logo: "/fakeyou/FakeYou-Logo-2.png",
    titlePart: "FakeYou",
    link: "https://fakeyou.com",
  },
};

const determineWebsite = (): WebsiteConfig => {
  // Fast resolve without leaking domain details
  switch (window.location.hostname) {
    case "fakeyou.com":
      return WEBSITE.fakeyou;
    case "storyteller.ai":
      return WEBSITE.storyteller;
    case "studio.storyteller.ai":
      return WEBSITE.storyteller_studio;
  }

  if (window.location.hostname.includes("storyteller")) {
    if (window.location.hostname.includes("studio")) {
      return WEBSITE.storyteller_studio;
    } else {
      return WEBSITE.storyteller;
    }
  } else {
    // Default fallback
    return WEBSITE.fakeyou;
  }
};

const CURRENT_WEBSITE : WebsiteConfig = determineWebsite();

export const GetWebsite = (): WebsiteConfig => {
  return CURRENT_WEBSITE;
};
