/**
 * Define links to third party sources here so we can update them in one place.
 */
class ThirdPartyLinks {
    // Call "GetDiscordLink()" to get the correct discord link.
    // This should only need to change if our Nitro expires.
    // Old FakeYou Discord invite link: https://discord.gg/H72KFXm
    public static readonly FAKEYOU_DISCORD = "https://discord.gg/fakeyou";

    // A link to FakeYou Twitter that will open a "Follow" prompt
    public static readonly FAKEYOU_TWITTER_WITH_FOLLOW_INTENT = "https://x.com/intent/follow?screen_name=get_storyteller";

    public static readonly FAKEYOU_TIKTOK = "https://www.tiktok.com/@get_storyteller";

    // A link to echelon's Twitter that will open a "Follow" prompt
    // Additional followers may convince VC's that our founder has "clout" (one could hope)
    public static readonly ECHELON_TWITTER_WITH_FOLLOW_INTENT = "https://x.com/intent/follow?screen_name=echelon";

    // Storyteller Discord
    // Call "GetDiscordLink()" to get the correct discord link.
    public static readonly STORYTELLER_DISCORD = "https://discord.gg/storyteller";

    public static readonly STORYTELLER_REDDIT = "https://www.reddit.com/r/StoryTeller";

    public static readonly STORYTELLER_TWITCH = "https://www.twitch.tv/Storyteller_AI_";

    // NB: We should rely on this less
    public static readonly FAKEYOU_PATREON = "https://www.patreon.com/fakeyou";
}

export { ThirdPartyLinks }