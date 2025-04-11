import { Environment } from "~/configs";

export enum FrontendEnvironmentType {
    Dev,
    DevProxy,
    Staging,
    Production,
}

export class FrontendEnvironment {
  private static instance: FrontendEnvironment;
  private readonly environment: FrontendEnvironmentType;
  private readonly isLocalDev: boolean;

  public static getInstance(): FrontendEnvironment {
    if (FrontendEnvironment.instance !== undefined) {
      return FrontendEnvironment.instance;
    }

    if (typeof document === "undefined") {
      // TODO(bt,2025-02-10): This is digusting. Vite or whatever 
      // doesn't have 'document' defined early in preloading execution.
      // This non-cached codepath is dangerous, because who knows what 
      // happens downstream. Fix this ASAP.
      return new FrontendEnvironment(FrontendEnvironmentType.Production, false);
    }

    const isLocalDev =
      document.location.host.includes("localhost") ||
      document.location.host.startsWith("dev.") ||
      document.location.host.startsWith("development.");

    let environmentType = FrontendEnvironmentType.Production;

    if (isLocalDev) {
      environmentType = FrontendEnvironmentType.Dev;
    }

    if (document.location.host.includes("dev") && 
        document.location.hostname.includes("proxy")) {
      environmentType = FrontendEnvironmentType.DevProxy;
    }

    const instance = new FrontendEnvironment(environmentType, isLocalDev);
    FrontendEnvironment.instance = instance;
    return instance;
  }

  public getFrontendEnvironmentType(): FrontendEnvironmentType {
    return this.environment;
  }

  public getIsLocalDev(): boolean {
    return this.isLocalDev;
  }

  private constructor(environment: FrontendEnvironmentType, isLocalDev: boolean) {
    this.environment = environment;
    this.isLocalDev = isLocalDev;
  }
}

export function GetFrontendEnvironment() : FrontendEnvironment {
  return FrontendEnvironment.getInstance();
}
