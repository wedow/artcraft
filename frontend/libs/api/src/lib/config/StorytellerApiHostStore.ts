// Artcraft / Storyteller API backend
const DEFAULT_API_HOST = "https://api.storyteller.ai";

export class StorytellerApiHostStore {
  private static instance: StorytellerApiHostStore;

  /**
   * The scheme and host of the API.
   * This can optionally include a port, but no path components (including `/`).
   * eg. http://localhost:12345 or https://api.storyteller.ai
   */
  private apiSchemeAndHost: string;

  public static getInstance(): StorytellerApiHostStore {
    if (StorytellerApiHostStore.instance !== undefined) {
      return StorytellerApiHostStore.instance;
    }
    const instance = new StorytellerApiHostStore(DEFAULT_API_HOST);
    StorytellerApiHostStore.instance = instance;
    return instance;
  }

  /** Get the API scheme and host. */
  public getApiSchemeAndHost(): string {
    return this.apiSchemeAndHost;
  }

  /** 
   * Externally update the API host. 
   * This is used to sync with Tauri for enabling easier development.
   */
  public setApiSchemeAndHost(apiSchemeAndHost: string) {
    // TODO(bt,2025-07-06): Actually parse URL.
    if (!apiSchemeAndHost.startsWith("http://") && !apiSchemeAndHost.startsWith("https://")) {
      throw new Error(`Scheme not included in URL: ${apiSchemeAndHost}`);
    }
    const FINAL_VALID_SLASH = "https://".lastIndexOf("/");
    if (apiSchemeAndHost.lastIndexOf("/") > FINAL_VALID_SLASH) {
      throw new Error(`Path components should not be included in URL: ${apiSchemeAndHost}`);
    }
    this.apiSchemeAndHost = apiSchemeAndHost;
  }

  private constructor(apiSchemeAndHost: string) {
    this.apiSchemeAndHost = apiSchemeAndHost;
  }
}
