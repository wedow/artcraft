import { ThirdPartyLinks } from "../constants/ThirdPartyLinks";
import { GetWebsite, Website } from "./GetWebsite";

const DISCORD_LINK : string = 
  GetWebsite().website === Website.FakeYou ? 
      ThirdPartyLinks.FAKEYOU_DISCORD : 
      ThirdPartyLinks.STORYTELLER_DISCORD;

export function GetDiscordLink() : string {
  return DISCORD_LINK;
}
