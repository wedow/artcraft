import { GetAppInfo } from "@storyteller/tauri-api";
import { StorytellerApiHostStore } from "@storyteller/api";

const SYNC_THRESHOLD = 10 * 1000;

class Cache {
  private static instance: Cache;
  private lastFetchSuccess?: number;

  public static getInstance(): Cache {
    if (Cache.instance !== undefined) {
      return Cache.instance;
    }
    const instance = new Cache();
    Cache.instance = instance;
    return instance;
  }

  public canCall() : boolean {
    if (this.lastFetchSuccess === undefined) {
      return true;
    }
    return Date.now() - this.lastFetchSuccess > SYNC_THRESHOLD;
  }

  public setCallSuccess() {
    this.lastFetchSuccess = Date.now();
  }
}

export const SyncStorytellerApiConfig = async () => {
  console.log("SyncStorytellerApiConfig()")

  const cache = Cache.getInstance();
  if (!cache.canCall()) {
    return;
  }

  GetAppInfo().then((appInfo) => {
    console.log("SyncStorytellerApiConfig() - appInfo", appInfo);
    const schemeAndHost = appInfo.payload.storyteller_host;
    if (!schemeAndHost) {
      return ;
    }
    console.log(`Updating hostname to ${schemeAndHost}`);
    StorytellerApiHostStore.getInstance().setApiSchemeAndHost(schemeAndHost);
    cache.setCallSuccess();
  });
}
