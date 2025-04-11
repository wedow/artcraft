export class LoadingVideosProvider {
  private horizontalLoadingVideo: HTMLVideoElement;
  private verticalLoadingVideo: HTMLVideoElement;
  private isLoadingVideoReady: boolean;
  constructor() {
    this.isLoadingVideoReady = false;
    let horizontalVideoIsReady = false;
    let verticalVideoIsReady = false;

    this.horizontalLoadingVideo = document.createElement("video");
    this.horizontalLoadingVideo.crossOrigin = "anonymous";
    this.horizontalLoadingVideo.onloadedmetadata = () => {
      horizontalVideoIsReady = true;
      if (verticalVideoIsReady) {
        this.isLoadingVideoReady = true;
        console.log("Loading Video is now Ready");
      }
    };

    this.verticalLoadingVideo = document.createElement("video");
    this.verticalLoadingVideo.crossOrigin = "anonymous";
    this.verticalLoadingVideo.onloadedmetadata = () => {
      verticalVideoIsReady = true;
      if (horizontalVideoIsReady) {
        this.isLoadingVideoReady = true;
        console.log("Loading Video is now Ready");
      }
    };

    this.horizontalLoadingVideo.src = "/placeholder_videos/light.mp4";
    this.verticalLoadingVideo.src = "/placeholder_videos/light_portrait_v2.mp4";
  }
  getHorizontalLoadingVideo() {
    if (this.isLoadingVideoReady) {
      return this.horizontalLoadingVideo;
    }
  }
  getVerticalLoadingVideo() {
    if (this.isLoadingVideoReady) {
      return this.verticalLoadingVideo;
    }
  }
}
