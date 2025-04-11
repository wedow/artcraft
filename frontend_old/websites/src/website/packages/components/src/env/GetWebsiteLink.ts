import { GetWebsite } from "./GetWebsite";

export const GetWebsiteLink = (rootedPath: string): string => {
  const website = GetWebsite();
  if (rootedPath.startsWith("/")) {
    return `${website.link}${rootedPath}`;
  } else {
    return `${website.link}/${rootedPath}`;
  }
};
