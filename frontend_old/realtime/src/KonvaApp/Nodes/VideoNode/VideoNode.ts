import Konva from "konva";
import { v4 as uuidv4 } from "uuid";

import { NetworkedNode, UploadStatus } from "../NetworkedNode";
import ChromaWorker from "../ChromaWorker?sharedworker";
import { transparent, NodeType } from "../constants";
import { SelectionManager } from "../../NodesManagers";
import {
  Position,
  Size,
  NodeData,
  TransformationData,
  RGBColor,
  VideoNodeData,
} from "../../types";
import { NodeUtilities } from "../NodeUtilities";

import { LoadingVideosProvider } from "~/KonvaApp/EngineUtitlities/LoadingVideosProvider";

interface VideoNodeContructor {
  mediaLayerRef: Konva.Layer;
  selectionManagerRef: SelectionManager;
  loadingVideosProviderRef: LoadingVideosProvider;
  canvasPosition: Position;
  canvasSize: Size;
  transform?: TransformationData;
  videoNodeData: Partial<VideoNodeData> & {
    mediaFileUrl: string;
  };
}

export class VideoNode extends NetworkedNode {
  public kNode: Konva.Image;
  public mediaFileUrl: string;
  public extractionUrl: string | undefined;
  public extractionPreviewUrl: string | undefined;
  public currentUrl: string;
  public videoComponent: HTMLVideoElement;
  protected _isVideoEventListening: boolean = false;

  // Use Context Menu Item
  public duration: number = 0;
  public fps: number = 24;

  // This locks interaction when the render engine is rendering
  private videoCanvas: OffscreenCanvas;
  context: OffscreenCanvasRenderingContext2D | null;
  chromaWorker: SharedWorker | undefined;
  drawingCanvas: OffscreenCanvas;
  drawingContext: OffscreenCanvasRenderingContext2D | null;
  blockSeeking: boolean;
  finishedLoadingOnStart?: Promise<void>;

  isChroma: boolean;
  chromaColor: RGBColor;

  private frameDidFinishSeeking: Promise<void>;
  public videoExtractionClickCallback?: () => void;

  constructor({
    mediaLayerRef,
    canvasPosition,
    canvasSize,
    videoNodeData,
    selectionManagerRef,
    loadingVideosProviderRef,
    transform: existingTransform,
  }: VideoNodeContructor) {
    const mediaFileSize =
      videoNodeData.videoWidth && videoNodeData.videoHeight
        ? { width: videoNodeData.videoWidth, height: videoNodeData.videoHeight }
        : undefined;
    const transform = NodeUtilities.getInitialTransform({
      existingTransform,
      mediaFileSize,
      canvasPosition,
      canvasSize,
    });
    // kNodes need to be created first to guaruntee it is not undefined in parent's context
    const kNode = new Konva.Image({
      image: undefined,
      // to do fix this with placeholder
      ...transform,
      draggable: true,
      strokeScaleEnabled: false,
    });

    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      loadingVideosProviderRef: loadingVideosProviderRef,
      kNode: kNode,
    });
    this.kNode = kNode;
    this.mediaLayerRef.add(this.kNode);

    // state manage the node
    // use web codecs to get the frame rate 89% support
    // assume 60fps for now.
    this.fps = 24; // need to query this from the media
    this.duration = -1; // video duration

    // console.log("constructing new video node with data:", videoNodeData);
    this.mediaFileUrl = videoNodeData.mediaFileUrl;
    this.extractionUrl = videoNodeData.extractionUrl;
    this.currentUrl = this.extractionUrl ?? this.mediaFileUrl;
    this.mediaFileToken = videoNodeData.mediaFileToken;
    this.mediaFileSize = mediaFileSize;

    this.videoComponent = document.createElement("video");
    this.videoComponent.crossOrigin = "anonymous";

    this.videoCanvas = new OffscreenCanvas(1280, 720);
    this.drawingCanvas = new OffscreenCanvas(1280, 720);

    this.context = this.videoCanvas.getContext("2d");
    this.drawingContext = this.drawingCanvas.getContext("2d");

    // Wrapping events
    this.frameDidFinishSeeking = new Promise<void>(() => {});
    this.finishedLoadingOnStart = new Promise<void>(() => {});

    this.blockSeeking = false;
    this.isChroma = videoNodeData.isChroma ?? false;
    this.chromaColor = videoNodeData.chromaColor ?? {
      red: 120,
      blue: 150,
      green: 120,
    };
    this.createChromaWorker();
    this.loadVideoFromUrl({
      videoUrl: this.extractionUrl ?? this.mediaFileUrl,
      // videoUrl: "", // for debug loading video
      hasExistingTransform: !!existingTransform || !!mediaFileSize,
      canvasPosition,
      canvasSize,
    });

    this.listenToBaseKNode();
  }
  private listenToVideoPlayPause() {
    // TODO: for controling video playpause, can be improved with bette ui
    this.kNode.on("click", () => {
      this.togglePlay();
    });
  }
  private removeLisentoVideoPlayPause() {
    this.kNode.removeEventListener("click");
  }
  public async loadVideoFromUrl({
    videoUrl,
    hasExistingTransform,
    canvasSize,
    canvasPosition,
  }: {
    videoUrl: string;
    hasExistingTransform: boolean;
    canvasSize?: Size;
    canvasPosition?: Position;
  }) {
    let loadingVideo: HTMLVideoElement | undefined = undefined;
    if (
      this.mediaFileSize &&
      this.mediaFileSize.width < this.mediaFileSize.height
    ) {
      loadingVideo = this.loadingVideosProviderRef?.getVerticalLoadingVideo();
    } else {
      loadingVideo = this.loadingVideosProviderRef?.getHorizontalLoadingVideo();
    }
    if (loadingVideo) {
      this.kNode.image(loadingVideo);
      loadingVideo.currentTime = 0;
      this.removeLisentoVideoPlayPause();
      const tryPlayLoadingVideo = async () => {
        try {
          await loadingVideo.play();
        } catch (err) {
          /*** catch and supress this error
           * NotAllowedError: play() failed because the user didn't
           * interact with the document first. https://goo.gl/xX8pDD
           ***/
          if (loadingVideo.paused) {
            setTimeout(tryPlayLoadingVideo, 500);
          }
        }
      };
      tryPlayLoadingVideo();
    } else {
      console.log("Loading Video not ready");
    }

    /**
     * for the events that does not need to be replaced
     */
    if (!this._isVideoEventListening) {
      this.videoComponent.onloadstart = () => {
        this.setProgress({ progress: 25, status: UploadStatus.LOADING });
      };
      this.videoComponent.onloadedmetadata = () => {
        this.setProgress({ progress: 50, status: UploadStatus.LOADING });
        console.log("Loaded Metadata");
        this.mediaFileSize = {
          width: this.videoComponent.videoWidth,
          height: this.videoComponent.videoHeight,
        };
        if (!hasExistingTransform && canvasSize && canvasPosition) {
          const adjustedSize = NodeUtilities.adjustNodeSizeToCanvas({
            componentSize: {
              width: this.videoComponent.videoWidth,
              height: this.videoComponent.videoHeight,
            },
            maxSize: canvasSize,
          });
          const centerPosition = NodeUtilities.positionNodeOnCanvasCenter({
            canvasOffset: canvasPosition,
            componentSize: adjustedSize,
            maxSize: canvasSize,
          });
          this.kNode.setSize(adjustedSize);
          this.kNode.setPosition(centerPosition);
        }
        this.duration = this.videoComponent.duration;
        this.videoComponent.currentTime = 0; // ensure it shows up on screen
        this.listenToVideoPlayPause();
        this.kNode.fill(transparent);
      };
      this.videoComponent.onloadeddata = async () => {
        this.setProgress({ progress: 75, status: UploadStatus.LOADING });
        await setTimeout(() => {
          this.setChroma(this.isChroma);
          // set chroma will do
          // this.kNode.image(this.videoComponent);
          // or
          // this.kNode.image(this.videoCanvas);
        }, 100);
      };
    }
    /*
     * Events to specifically listen to on each loading
     * video datat from url
     */
    this.finishedLoadingOnStart = new Promise<void>((resolve, reject) => {
      this.videoComponent.oncanplaythrough = async () => {
        console.log("Can play through the Mediafile:", this.videoComponent.src);
        this.didFinishLoading = true;
        this.setProgress({ progress: 100, status: UploadStatus.SUCCESS });
        resolve();
      };

      this.videoComponent.onerror = () => {
        this.setProgress({ progress: 0, status: UploadStatus.ERROR_ON_LOAD });
        reject();
      };
    });

    // the actual LOADING of the VIDEOURL
    this.currentUrl = videoUrl;
    this.videoComponent.src = this.currentUrl;

    try {
      await this.finishedLoadingOnStart;
      this.videoComponent.oncanplaythrough = null;
      this.videoComponent.onerror = null;
    } catch (err) {
      // nothing for now
      // TODO: impolement retry
    }
  }
  public togglePlay() {
    // Shouldn't play in these situations
    if (this.didFinishLoading == false) {
      return;
    }
    if (this.isProcessing == true) {
      return;
    }
    if (this.videoExtractionClickCallback) {
      // if (this.isSegmentationMode) {
      // console.log("Not Playing because Segmenting");
      return;
    }

    if (this.videoComponent.paused) {
      console.log("Playing", this.videoComponent.src);
      this.videoComponent.play();
      this.chromaKeyRender(0); // For starting Chroma
    } else {
      console.log("Pause", this.videoComponent.src);
      this.videoComponent.pause();
    }
  }

  async reset() {
    this.videoComponent.pause();
    await this.seek(0);
  }
  getNumberFrames(): number {
    return this.fps * this.duration;
  }
  public getChroma() {
    return {
      isChromakeyEnabled: this.isChroma,
      chromakeyColor: this.chromaColor,
    };
  }
  public setChroma(isChroma: boolean) {
    this.isChroma = isChroma;

    if (this.isChroma === false) {
      this.kNode.image(this.videoComponent);
    } else {
      console.log("set video to use its videocanvas counterpart");
      this.kNode.image(this.videoCanvas);
      if (this.videoComponent.paused || this.videoComponent.ended) {
        this.chromaKeyRender(0, false, false, true);
      } else {
        this.chromaKeyRender(0);
      }
    }
  }

  public setChromaColor(newChromaColor: RGBColor) {
    this.chromaColor = newChromaColor;
  }

  createChromaWorker() {
    this.chromaWorker = new ChromaWorker({
      name: "ChromaWorker-" + uuidv4(),
    });
    this.chromaWorker.port.start();
  }

  async chromaKeyRender(
    _timestamp: number | undefined,
    doLoop: boolean = true,
    stopLoopIfVideoIsPausedOrEnded: boolean = true,
    blockSeeking: boolean = false,
  ) {
    if (this.isChroma === false) return;
    if (this.videoComponent !== undefined) {
      if (stopLoopIfVideoIsPausedOrEnded)
        if (this.videoComponent.paused || this.videoComponent.ended) return;
      if (this.drawingContext != null) {
        if (
          this.videoCanvas.width !== this.videoComponent.videoWidth ||
          this.videoCanvas.height !== this.videoComponent.videoHeight ||
          this.drawingCanvas.width !== this.videoComponent.videoWidth ||
          this.drawingCanvas.height !== this.videoComponent.videoHeight
        ) {
          this.videoCanvas.width = this.videoComponent.videoWidth;
          this.videoCanvas.height = this.videoComponent.videoHeight;
          this.drawingCanvas.width = this.videoComponent.videoWidth;
          this.drawingCanvas.height = this.videoComponent.videoHeight;
        }
        if (blockSeeking) {
          this.blockSeeking = true;
        }

        this.drawingContext.drawImage(
          this.videoComponent,
          0,
          0,
          this.drawingCanvas.width,
          this.drawingCanvas.height,
        );

        const dataTransfer = this.drawingCanvas.transferToImageBitmap();
        await this.waitForWorkerResponse(dataTransfer, blockSeeking);
      } else {
        console.error("Context does not exist!");
      }
    } else {
      console.error("Video component does not exist!");
    }

    if (doLoop) requestAnimationFrame(this.chromaKeyRender.bind(this));
  }

  // Method to post the message and wait for the response
  async waitForWorkerResponse(
    dataTransfer: ImageBitmap,
    blockSeeking: boolean,
  ) {
    return new Promise<void>((resolve, reject) => {
      // Add an event listener for the worker response
      const onMessage = (event: MessageEvent) => {
        const { imageData } = event.data;
        this.context?.putImageData(imageData, 0, 0);
        this.mediaLayerRef.draw();
        if (this.blockSeeking) {
          this.blockSeeking = false;
        }

        // Clean up the event listener after receiving the message
        this.chromaWorker?.port.removeEventListener("message", onMessage);
        resolve();
      };

      // Attach the event listener
      this.chromaWorker?.port.addEventListener("message", onMessage);

      // Send the data to the worker
      this.chromaWorker?.port.postMessage(
        {
          dataTransfer: dataTransfer,
          color: this.chromaColor,
        },
        [dataTransfer],
      );
    });
  }

  // use sub milisecond for frames.
  async seek(second: number) {
    // prevent interaction

    if (this.didFinishLoading === false) {
      console.log("Didn't finish loading so cannot seek");
      return;
    }

    if (this.videoComponent.seekable) {
      if (!this.videoComponent) {
        console.log("Didn't setup Video Component?");
        return;
      }
      //console.log(`Seeking to Position ${second}`);
      this.videoComponent.pause();
      this.videoComponent.currentTime = second;

      this.frameDidFinishSeeking = new Promise<void>((resolve, reject) => {
        this.videoComponent.onseeked = async (event: Event) => {
          console.log("Seeked Finished");
          // reimplement using the function
          // ensure that this doesn't race.
          await this.chromaKeyRender(0, false, false, true);
          resolve();
        };
      });
      try {
        await this.frameDidFinishSeeking;
        this.videoComponent.onseeked = null;
      } catch (err) {
        // do nothing for now
      }
    } else {
      console.log("Video Not Seekable");
    }
  }

  public enableExtractionMode(callback: () => void) {
    this.removeListenToBaseKNode();
    this.kNode.on("click", callback);
    this.videoExtractionClickCallback = callback;
  }
  public disableExtractionMode() {
    if (this.videoExtractionClickCallback) {
      this.kNode.off("click", this.videoExtractionClickCallback);
    }
    this.extractionPreviewUrl = undefined;
    this.videoExtractionClickCallback = undefined;
    this.listenToBaseKNode();
  }

  public async setVideoExtractionPreview(previewImageUrl: string) {
    this.extractionPreviewUrl = previewImageUrl;
    const imageObj = new Image();

    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      imageObj.onload = () => {
        this.kNode.image(imageObj);
        this.mediaLayerRef.draw();
        resolve();
      };
      imageObj.onerror = () => {
        reject("Image Failed To Load");
      };
    });
    imageObj.src = previewImageUrl;
    return imageLoadPromise;
  }

  public async retry() {
    console.log("Video Node has not implement retry");
  }
  public getNodeData(canvasPostion: Position) {
    const data: NodeData = {
      type: NodeType.VIDEO,
      transform: {
        position: {
          x: this.kNode.position().x - canvasPostion.x,
          y: this.kNode.position().y - canvasPostion.y,
        },
        size: this.kNode.size(),
        rotation: this.kNode.rotation(),
        scale: {
          x: this.kNode.scaleX(),
          y: this.kNode.scaleY(),
        },
        zIndex: this.kNode.getZIndex(),
      },

      // video specific values
      videoNodeData: {
        mediaFileUrl: this.mediaFileUrl,
        mediaFileToken: this.mediaFileToken,
        isChroma: this.isChroma,
        chromaColor: this.chromaColor,
        extractionUrl: this.extractionUrl,
        videoWidth: this.mediaFileSize?.width,
        videoHeight: this.mediaFileSize?.height,
      },
    };
    return data;
  }

  // BACKUPS

  // 1. DUMMY VIDEO with IMAGES
  // private imageIndex: number = 0;
  // private imageSources: string[] = [
  //   "https://images-ng.pixai.art/images/orig/7ef23baa-2fc8-4e2f-8299-4f9241920090",
  //   "https://images-ng.pixai.art/images/orig/98196e9f-b968-4fe1-97ec-083ffd77c263",
  //   "https://images-ng.pixai.art/images/orig/a05a49dd-6764-4bfe-902f-1dfad67e49c9",
  //   "https://images-ng.pixai.art/images/orig/a449179c-c549-4627-8806-49dc5a30c429",
  //   "https://images-ng.pixai.art/images/orig/809eafc6-79c8-4c7a-89cd-bfc7ab39f142",
  //   "https://images-ng.pixai.art/images/orig/5f004e09-e3ac-4461-b2b1-0d70f2255c34",
  //   "https://images-ng.pixai.art/images/orig/56dcbb5f-7a31-4328-b4ea-1312df6e77a0",
  //   "https://videos.pixai.art/f7df019d-79a2-4ed2-bb99-775c941f7ec6",
  // ];

  // async updateImage(newImageSrc: string) {
  //   const newImage = new Image();
  //   newImage.src = newImageSrc;
  //   newImage.onload = () => {
  //     if (!this.kNode) {
  //       console.log("selectedNode KNode is initialized");
  //       return;
  //     }
  //     this.kNode.image(newImage);
  //     this.kNode.draw();
  //   };
  // }
  // async simulatedLoading() {
  //   // need to block playing while loading
  //   this.didFinishLoading = false;

  //   console.log(this.imageIndex);

  //   if (this.imageIndex == 0) {
  //     loadingBar.show();
  //   }

  //   await this.updateImage(this.imageSources[this.imageIndex]);
  //   this.imageIndex = this.imageIndex + 1;

  //   // this.updateLoadingBarPosition();

  //   loadingBar.updateMessage("Generating");

  //   if (this.imageIndex == this.imageSources.length - 1) {
  //     // show final video
  //     console.log("Final Video Element");
  //     await this.createVideoElement(
  //       this.imageSources[this.imageSources.length - 1],
  //     );
  //     console.log("Done Video Element");
  //   }

  //   if (this.imageIndex < this.imageSources.length - 1) {
  //     loadingBar.updateProgress(
  //       (this.imageIndex / this.imageSources.length) * 100,
  //     );
  //     setTimeout(this.simulatedLoading.bind(this), 500); // Update every second
  //   }
  // }
}
