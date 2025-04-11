class BucketConfig {
  isLocalDev: boolean;

  constructor() {
    this.isLocalDev =
      document.location.host.includes("localhost") ||
      document.location.host.includes("jungle.horse") ||
      document.location.host.startsWith("dev.");
  }

  // TODO: Prevent callers with undefined/null paths
  getGcsUrl(bucketRelativePath: string | undefined | null): string {
    let bucket = this.getBucket();
    let path = bucketRelativePath;
    if (path !== undefined && path !== null && !path.startsWith("/")) {
      path = "/" + path;
    }
    if (!this.isLocalDev) {
      return `https://cdn-2.fakeyou.com${path}`;
    }
    return `https://storage.googleapis.com/${bucket}${path}`;
  }

  private getBucket(): string {
    return this.isLocalDev ? "dev-vocodes-public" : "vocodes-public";
  }

  getCdnUrl(
    bucketRelativePath: string,
    width?: number,
    quality?: number
  ): string {
    const basePath = this.isLocalDev
      ? "https://dev-cdn.fakeyou.com"
      : "https://cdn-2.fakeyou.com";
    let path = bucketRelativePath?.startsWith("/")
      ? bucketRelativePath
      : "/" + bucketRelativePath;
    let resizeParams = "";
    if (width || quality) {
      resizeParams = "cdn-cgi/image/";
      if (width) {
        resizeParams += `width=${width},`;
      }
      if (quality) {
        resizeParams += `quality=${quality},`;
      }
      resizeParams = resizeParams.slice(0, -1);
    }
    if (resizeParams) {
      return `${basePath}/${resizeParams}${path}`;
    } else {
      return `${basePath}${path}`;
    }
  }
}

export { BucketConfig };
