enum Environment {
  Development,
  Staging,
  Production,
}

export class FakeYouFrontendEnvironment {
  static instance?: FakeYouFrontendEnvironment;

  environment: Environment;

  private constructor() {
    const domainWithoutPort = document.location.host.split(":")[0];

    switch (domainWithoutPort) {
      case "fakeyou.com":
        this.environment = Environment.Production;
        break;
      case "staging.fakeyou.com":
        this.environment = Environment.Staging;
        break;
      case "localhost":
      case "dev.fakeyou.com":
        this.environment = Environment.Development;
        break;
      default:
        this.environment = Environment.Production;
    }
  }

  public static getInstance(): FakeYouFrontendEnvironment {
    if (FakeYouFrontendEnvironment.instance === undefined) {
      FakeYouFrontendEnvironment.instance = new FakeYouFrontendEnvironment();
    }
    return FakeYouFrontendEnvironment.instance;
  }

  public useProductionStripePlans(): boolean {
    return this.isProduction() || this.isStaging();
  }

  public isProduction(): boolean {
    return this.environment === Environment.Production;
  }

  public isStaging(): boolean {
    return this.environment === Environment.Staging;
  }

  public isDevelopment(): boolean {
    return this.environment === Environment.Development;
  }
}
