import Konva from "konva";
import { Container } from "konva/lib/Container";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";

import { DiffusionSharedWorkerClient } from "../SharedWorkers/Diffusion/DiffusionSharedWorkerClient";
import {
  // SharedWorkerRequest,
  SharedWorkerResponse,
} from "../WorkerPrimitives/SharedWorkerBase";
import {
  DiffusionSharedWorkerProgressData,
  DiffusionSharedWorkerResponseData,
  // DiffusionSharedWorker,
  DiffusionSharedWorkerItemData,
} from "../SharedWorkers/Diffusion/DiffusionSharedWorker";

import { RenderingOptions } from "../Engine";
import { FileUtilities } from "../FileUtilities/FileUtilities";
import { ImageNode, VideoNode, TextNode } from "../Nodes";
import { MediaNode } from "../types";

import { RenderTask } from "./RenderTask";
import { OffScreenSceneCanvas } from "./OffScreenSceneCanvas";

// https://www.aiseesoft.com/resource/phone-aspect-ratio-screen-resolution.html#:~:text=16%3A9%20Aspect%20Ratio

export class RenderEngine {
  private videoNodes: VideoNode[];
  private imageNodes: (ImageNode | TextNode)[];

  private offScreenCanvas: OffscreenCanvas;
  private context: OffscreenCanvasRenderingContext2D | null;

  private isProcessing: boolean;

  // private frames: ImageBitmap[];

  // capturing composite within window
  private bgLayerRef: Konva.Layer;
  private mediaLayerRef: Konva.Layer;

  private height: number;
  private width: number;
  private positionX: number;
  private positionY: number;

  private canUseSharedWorker: boolean;

  private port: MessagePort | undefined;
  private upperMaxFrames: number;

  public captureCanvas: Konva.Rect;

  public videoLoadingCanvas: VideoNode | undefined;

  public fps: number = 24;
  constructor({
    width,
    height,
    bgLayerRef,
    mediaLayerRef,
    offScreenCanvas,
    onRenderingSystemMessageRecieved,
  }: {
    width: number;
    height: number;
    bgLayerRef: Konva.Layer;
    mediaLayerRef: Konva.Layer;
    offScreenCanvas: OffscreenCanvas;
    onRenderingSystemMessageRecieved: (
      response: SharedWorkerResponse<
        DiffusionSharedWorkerResponseData,
        DiffusionSharedWorkerProgressData
      >,
    ) => void;
  }) {
    this.videoLoadingCanvas = undefined;
    this.videoNodes = [];
    this.imageNodes = [];

    this.isProcessing = false;
    this.onRenderingSystemMessageRecieved = onRenderingSystemMessageRecieved;
    // TODO: Make this dynamic and update this on change of canvas.

    this.width = width;
    this.height = height;
    this.positionX = window.innerWidth / 2 - this.width / 2;
    this.positionY = window.innerHeight / 2 - this.height / 2;

    this.offScreenCanvas = offScreenCanvas;
    this.offScreenCanvas.width = this.width;
    this.offScreenCanvas.height = this.height;
    this.context = this.offScreenCanvas.getContext("2d");

    // this.frames = [];

    this.bgLayerRef = bgLayerRef;
    this.mediaLayerRef = mediaLayerRef;

    this.port = undefined;

    this.fps = 24;

    this.captureCanvas = new Konva.Rect({
      name: "CaptureCanvas",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      fill: "white",
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
    });

    this.upperMaxFrames = 7 * this.fps; // seconds by fps

    this.bgLayerRef.add(this.captureCanvas);
    // send back
    this.captureCanvas.setZIndex(0);

    this.canUseSharedWorker = false;
    this.setupSharedWorker();

    //this.debug();
  }

  private onRenderingSystemMessageRecieved: (
    response: SharedWorkerResponse<
      DiffusionSharedWorkerResponseData,
      DiffusionSharedWorkerProgressData
    >,
  ) => void;

  private diffusionWorker:
    | DiffusionSharedWorkerClient<
        DiffusionSharedWorkerItemData,
        DiffusionSharedWorkerResponseData,
        DiffusionSharedWorkerProgressData
      >
    | undefined;

  async updateCaptureCanvas(
    width: number | undefined,
    height: number | undefined,
  ) {
    if (!this.captureCanvas) {
      return;
    }
    if (width) {
      this.width = width;
    }
    if (height) {
      this.height = height;
    }

    // Ensures that all the nodes stag in the same place should
    // there be a window resize.
    // recompute the position
    // to ensure that the position of this stays

    const oldPositionX = this.positionX;
    const oldPositionY = this.positionY;

    // recompute the position
    this.positionX = window.innerWidth / 2 - this.width / 2;
    this.positionY = window.innerHeight / 2 - this.height / 2;

    this.captureCanvas.setPosition({ x: this.positionX, y: this.positionY });
    this.captureCanvas.size({ width: this.width, height: this.height });

    // this is the change in positions
    const deltaX = this.positionX - oldPositionX;
    const deltaY = this.positionY - oldPositionY;

    var children = this.mediaLayerRef.getChildren();
    for (let i = 0; i < children.length; i++) {
      let node = children[i];

      // skip the capture canvas update.
      if (node.name() === "CaptureCanvas") {
        continue;
      }
      const pos = node.getPosition();
      node.setPosition({
        x: pos.x + deltaX,
        y: pos.y + deltaY,
      });
    }

    // update the context menu
    // TODO: find selected node and update that position
    // this.videoNodes.forEach((node) => {
    //   node.updateContextComponents();
    // });

    this.mediaLayerRef.batchDraw();
  }

  debug() {
    // DEBUG ONLY
    const rectangle = new Konva.Rect({
      x: this.positionX,
      y: this.positionY,
      width: 100,
      height: 100,
      fill: "green",
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
    });
    this.mediaLayerRef.add(rectangle);
  }

  async sendCanvasPayload(renderTask: RenderTask) {
    if (!this.port) {
      return console.log("Undefined Worker");
    }
    this.port.postMessage(renderTask);
  }

  setupSharedWorker() {
    if (typeof SharedWorker !== "undefined") {
      console.log("Shared Workers are supported in this browser.");
      // Debug chrome://inspect/#workers
      //  "src\\KonvaApp\\SharedWorkers\\Diffusion\\DiffusionSharedWorker.ts",
      this.diffusionWorker = new DiffusionSharedWorkerClient(
        this.onRenderingSystemMessageRecieved,
      );

      this.canUseSharedWorker = true;
    } else {
      console.log("Shared Workers are not supported in this browser.");
      // Handle the lack of Shared Worker support (e.g., fallback to another solution)
      this.canUseSharedWorker = false;
    }
  }

  public placeDebugRect(
    x: number,
    y: number,
    width: number,
    height: number,
    layer: Konva.Layer,
  ): void {
    const rect = new Konva.Rect({
      x: x,
      y: y,
      width: width, // Default width
      height: height, // Default height
      fill: "green",
      draggable: false,
    });

    layer.add(rect);
    layer.draw();
  }

  // This function uses a portion of the video layer to capture just the capture canvas.
  // capture everything after seeking each video node.
  renderPortionOfLayer(
    layer: Konva.Layer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): HTMLCanvasElement {
    const canvas = layer.toCanvas({
      x: x,
      y: y,
      width: width,
      height: height,
    });
    return canvas;
  }

  private findLongestVideoLength(): number {
    let maxLength = 0;
    // could simplify this logic to ensure that imageNodes has number of frames.
    if (this.imageNodes.length > 0 && this.videoNodes.length === 0) {
      return this.fps * 3; // three seconds determine whether to change this
    }

    this.videoNodes.forEach((node) => {
      const videoLength = node.getNumberFrames();
      if (videoLength > maxLength) {
        maxLength = videoLength;
      }
    });
    return maxLength;
  }

  public addNodes(node: MediaNode) {
    if (node instanceof VideoNode) {
      this.videoNodes.push(node);
    } else if (node instanceof ImageNode || node instanceof TextNode) {
      this.imageNodes.push(node);
    }
  }

  public removeNodes(node: MediaNode) {
    if (node instanceof VideoNode) {
      const index = this.videoNodes.indexOf(node);
      if (index > -1) {
        this.videoNodes.splice(index, 1);
      }
    } else if (node instanceof ImageNode || node instanceof TextNode) {
      const index = this.imageNodes.indexOf(node);
      if (index > -1) {
        this.imageNodes.splice(index, 1);
      }
    }
  }

  // Do a bunch of precondition checks and error out early on.
  public async startProcessing(renderingOptions?: RenderingOptions) {
    // Start processing and lock everything

    this.isProcessing = true;

    try {
      // or not loaded
      if (this.videoNodes.length + this.imageNodes.length < 1) {
        throw Error("Must at least have 1 item on the board.");
      }
      // error out if nodes are not all loaded.
      // todo remove when we have error handling + and ui
      var failed = false;

      // if there are atleast 1 video node images are all covered.
      for (let i = 0; i < this.videoNodes.length; i++) {
        const item = this.videoNodes[i];
        if (!item.kNode) {
          return;
        }
        item.kNode.listening(false);
        item.unhighlight();
        if (item.didFinishLoading == false) {
          // error out and show error message
          //this.startProcessing();
          failed = true;
          setTimeout(this.startProcessing.bind(this), 1000);
          break;
        }
        item.setProcessing(true);
      }

      // todo remove
      if (failed) {
        // throw error
        throw Error("Wait For Items to Finish Processing.");
      }

      //this.videoNodes.forEach((item: VideoNode) => {});

      // find the longest video node
      let numberOfFrames = this.findLongestVideoLength();
      numberOfFrames = Math.min(numberOfFrames, this.upperMaxFrames);
      console.log(`Number Of Frames: ${numberOfFrames}`);

      await this.render(numberOfFrames, renderingOptions);
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      this.isProcessing = false;

      // enable all nodes again.
      for (let i = 0; i < this.videoNodes.length; i++) {
        const item = this.videoNodes[i];
        if (!item.kNode) {
          return;
        }
        item.setProcessing(false);
        item.kNode.listening(true);
      }
    }
  }

  // public stopProcessing() {
  //   this.isProcessing = false;
  // }

  // find the frame time given the frame number
  private calculateFrameTime(frameNumber: number, frameRate: number): number {
    return frameNumber / frameRate;
  }

  /**
   *
   * @param config
   */
  private async renderFrame(config: {
    layerOfInterest: Konva.Layer; // layer where the element that you want to clip lives.
    // XY and height of a captureCanvas ( region of interest )
    x?: number; // x position of the region of interest
    y?: number; // y position of the region of interest
    width?: number; // size of the region of interest
    height?: number; // size of the region of interest
    pixelRatio?: number; // higher means higher quality
    mimeType?: string; // image/jpeg or image/png
    quality?: number; // 1.0 is the best.
    test: boolean; // true == blob else Image Bitmap
  }): Promise<ImageBitmap | Blob> {
    try {
      const box = config.layerOfInterest.getClientRect();
      const stage = config.layerOfInterest.getStage();

      const x = config.x !== undefined ? config.x : Math.floor(box.x);
      const y = config.y !== undefined ? config.y : Math.floor(box.y);
      const pixelRatio = config.pixelRatio || 1;

      const container = config.layerOfInterest as Container<Group | Shape>;

      const offScreenSceneCanvas = new OffScreenSceneCanvas({
        width:
          config.width || Math.ceil(box.width) || (stage ? stage.width() : 0),
        height:
          config.height ||
          Math.ceil(box.height) ||
          (stage ? stage.height() : 0),
        pixelRatio: pixelRatio,
      });

      // TODO: fill canvas white properly
      const context = offScreenSceneCanvas.getContext();
      // context.fillStyle = "white";
      // context.fillRect(
      //   0,
      //   0,
      //   offScreenSceneCanvas.width,
      //   offScreenSceneCanvas.height,
      // );

      const buffer = new OffScreenSceneCanvas({
        width:
          offScreenSceneCanvas.width / offScreenSceneCanvas.pixelRatio +
          Math.abs(x),
        height:
          offScreenSceneCanvas.height / offScreenSceneCanvas.pixelRatio +
          Math.abs(y),
        pixelRatio: offScreenSceneCanvas.pixelRatio,
      });

      context.save();

      if (x || y) {
        context.translate(-1 * x, -1 * y);
      }
      container.drawScene(offScreenSceneCanvas, undefined, buffer);
      // Not a type mistake ... DO NOT FIX
      // @ts-ignore
      const offscreenCanvas = offScreenSceneCanvas._canvas as OffscreenCanvas;
      let result = undefined;

      // if config.test is true, the result is downloaded to the local files
      // config.test = true;
      if (config.test) {
        const blob = await offscreenCanvas.convertToBlob({
          quality: config.quality ?? 1.0,
          type: "image/jpeg",
        });
        await FileUtilities.blobToFileJpeg(blob, "1");
        result = blob;
      } else {
        result = offscreenCanvas.transferToImageBitmap();
      }
      context.restore();
      return result;
    } catch (error) {
      throw error;
    }
  }
  /** 
  find longest video
  then seek through each node 1 step.
  stop ignore stepping if the duration is less.
  **/
  private async render(
    largestNumberOfFrames: number,
    renderingOptions?: RenderingOptions,
  ) {
    if (!this.isProcessing) return;

    // Stop all nodes first
    console.log(`LargestNumberOfFrames:${largestNumberOfFrames}`);
    for (let k = 0; k < this.videoNodes.length; k++) {
      const videoNode = this.videoNodes[k];
      if (videoNode.didFinishLoading === false) {
        throw Error("Videos Did Not Finish Loading Please Try Again.");
      }
      await videoNode.reset();
    }

    // only pick nodes that intersect with the canvas on screen bounds to freeze.
    for (let j = 0; j < largestNumberOfFrames; j++) {
      // Seek Video Nodes first then draw
      let frameTime = undefined;

      for (let i = 0; i < this.videoNodes.length; i++) {
        const currentVideoNode = this.videoNodes[i];
        frameTime = this.calculateFrameTime(j, currentVideoNode.fps);
        frameTime = parseFloat(frameTime.toFixed(2));
        if (frameTime < currentVideoNode.duration) {
          // console.log(`CurrentFrame:${j}`);
          // console.log(`FrameTime:${frameTime}`);
          // console.log(`Duration:${currentVideoNode.duration}`);
          await currentVideoNode.seek(frameTime);
        } // end of if context
      } // End frame time
      this.mediaLayerRef.draw();

      // use main thread
      if (this.canUseSharedWorker === false) {
        // SCOPES the capture for the context
        // Correct size for the mobile canvas.
        this.offScreenCanvas.width = this.width;
        this.offScreenCanvas.height = this.height;
        if (this.context) {
          // This crops it starting at position X / Y where the mobile canvas is
          // Then picks the height and width range
          // then we draw it at 0,0,width and height of the canvas
          this.context.drawImage(
            this.mediaLayerRef.canvas._canvas,
            this.positionX,
            this.positionY,
            this.width,
            this.height,
            0,
            0,
            this.width,
            this.height,
          );
          //TODO write the non webworker version
          const blob = await this.offScreenCanvas.convertToBlob({
            quality: 1.0,
            type: "image/jpeg",
          });
          await FileUtilities.blobToFileJpeg(blob, "1");

          break;
        } // end of for each frame
      } else {
        // decode on the shared webworker.
        if (!this.context) {
          console.log("Context Didn't Initialize");
          return;
        }

        if (!this.diffusionWorker) {
          console.log("Didn't Initialize Diffusion");
          return;
        }

        console.log(
          `context: x:${this.positionX} y:${this.positionY} ${this.width} x ${this.height}`,
        );

        const bitmap = await this.renderFrame({
          layerOfInterest: this.mediaLayerRef,
          x: this.captureCanvas.x(),
          y: this.captureCanvas.y(),
          width: this.width,
          height: this.height,
          mimeType: "image/jpeg",
          pixelRatio: 1,
          quality: 1.0,
          test: false,
        });

        const data: DiffusionSharedWorkerItemData = {
          height: this.height,
          width: this.width,
          imageBitmap: bitmap as ImageBitmap,
          frame: j,
          totalFrames: largestNumberOfFrames,
          prompt: renderingOptions,
        };
        console.log(
          `Processing Frame:${j + 1} out of ${largestNumberOfFrames}`,
        );
        this.diffusionWorker.sendData(1, data, false);
      }
    } // end of largest number of frames loop

    // finished looping
    if (!this.diffusionWorker) {
      console.log("Didn't Initialize Diffusion");
      return;
    }

    const jobID = 1;
    this.diffusionWorker.sendData(
      jobID,
      {
        height: this.height,
        width: this.width,
        imageBitmap: undefined,
        frame: -1,
        totalFrames: largestNumberOfFrames,
        prompt: renderingOptions,
      },
      true,
    );
  }
}
