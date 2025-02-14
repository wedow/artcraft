import Konva from "konva";
import { Container } from "konva/lib/Container";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";

import {
  // SharedWorkerRequest,
  SharedWorkerResponse,
} from "../WorkerPrimitives/SharedWorkerBase";
import {
  DiffusionSharedWorkerProgressData,
  DiffusionSharedWorkerResponseData,
} from "../SharedWorkers/Diffusion/DiffusionSharedWorker";

import { FileUtilities } from "../FileUtilities/FileUtilities";
import { ImageNode, VideoNode, TextNode } from "../Nodes";
import { MediaNode } from "../types";

import { RenderTask } from "./RenderTask";
import { OffScreenSceneCanvas } from "./OffScreenSceneCanvas";

// https://www.aiseesoft.com/resource/phone-aspect-ratio-screen-resolution.html#:~:text=16%3A9%20Aspect%20Ratio

export class RealTimeDrawEngine {
  private videoNodes: VideoNode[];
  private imageNodes: (ImageNode | TextNode)[];

  private offScreenCanvas: OffscreenCanvas;

  // private frames: ImageBitmap[];

  // capturing composite within window
  private bgLayerRef: Konva.Layer;
  private mediaLayerRef: Konva.Layer;

  private height: number;
  private width: number;
  private positionX: number;
  private positionY: number;
  private positionPreviewX: number;
  private positionPreviewY: number;

  private port: MessagePort | undefined;

  public captureCanvas: Konva.Rect;
  public previewCanvas: Konva.Image;

  public videoLoadingCanvas: VideoNode | undefined;

  public fps: number = 24;
  constructor({
    width,
    height,
    bgLayerRef,
    mediaLayerRef,
    offScreenCanvas,
  }: {
    width: number;
    height: number;
    bgLayerRef: Konva.Layer;
    mediaLayerRef: Konva.Layer;
    previewLayerRef: Konva.Layer;
    offScreenCanvas: OffscreenCanvas;
  }) {
    this.videoLoadingCanvas = undefined;
    this.videoNodes = [];
    this.imageNodes = [];

    // TODO: Make this dynamic and update this on change of canvas.

    this.width = width;
    this.height = height;

    this.positionX = window.innerWidth / 2 - this.width / 2 - this.width;
    this.positionY = window.innerHeight / 2 - this.height / 2;

    this.positionPreviewX = window.innerWidth / 2 - this.width / 2 + this.width;
    this.positionPreviewY = window.innerHeight / 2 - this.height / 2;

    this.offScreenCanvas = offScreenCanvas;
    this.offScreenCanvas.width = this.width;
    this.offScreenCanvas.height = this.height;

    this.bgLayerRef = bgLayerRef;

    // this is the whole canvas
    this.mediaLayerRef = mediaLayerRef;

    // this.previewLayerRef = previewLayerRef;
    // Set background layer to red and media layer to green for visibility

    this.port = undefined;

    this.fps = 24;

    // This is captures a subset of the medialayer ref
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

    // Add preview canvas with same dimensions but different style
    // this.previewCanvas = new Konva.Rect({
    //   name: "PreviewCanvas",
    //   x: this.positionX,
    //   y: this.positionY,
    //   width: this.width,
    //   height: this.height,
    //   fill: "white",
    //   stroke: "blue",
    //   strokeWidth: 1,
    //   dash: [5, 5],
    //   draggable: false,
    // });

    this.previewCanvas = new Konva.Image({
      name: "PreviewCanvas",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      image: undefined,
      stroke: "blue",
      strokeWidth: 1,
      dash: [5, 5],
      draggable: false,
    });

    this.bgLayerRef.add(this.captureCanvas);
    this.bgLayerRef.add(this.previewCanvas);
    // send back
    this.captureCanvas.setZIndex(0);
    this.previewCanvas.setZIndex(0);

    //this.debug();
  }

  async updateCaptureCanvas(
    width: number | undefined,
    height: number | undefined,
  ) {
    if (!this.captureCanvas || !this.previewCanvas) {
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
    const padBetweenCaptureAndPreview = 10;
    this.positionX =
      window.innerWidth / 2 -
      this.width / 2 -
      this.width / 2 -
      padBetweenCaptureAndPreview;
    this.positionY = window.innerHeight / 2 - this.height / 2;

    this.positionPreviewX =
      window.innerWidth / 2 -
      this.width / 2 +
      this.width / 2 +
      padBetweenCaptureAndPreview;
    this.positionPreviewY = window.innerHeight / 2 - this.height / 2;

    this.captureCanvas.setPosition({
      x: this.positionX,
      y: this.positionY,
    });
    this.captureCanvas.size({ width: this.width, height: this.height });

    this.previewCanvas.setPosition({
      x: this.positionPreviewX,
      y: this.positionPreviewY,
    });
    this.previewCanvas.size({ width: this.width, height: this.height });

    // this is the change in positions
    const deltaX = this.positionX - oldPositionX;
    const deltaY = this.positionY - oldPositionY;

    var children = this.mediaLayerRef.getChildren();
    for (let i = 0; i < children.length; i++) {
      let node = children[i];

      // skip the capture canvas and preview canvas update.
      if (node.name() === "CaptureCanvas" || node.name() === "PreviewCanvas") {
        continue;
      }
      const pos = node.getPosition();
      node.setPosition({
        x: pos.x + deltaX,
        y: pos.y + deltaY,
      });
    }

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

  private handleNodeDragEnd = () => {
    // Clean up any existing state
    console.log("Node drag ended");
    this.render();
  };
  public addNodes(node: MediaNode) {
    if (node instanceof VideoNode) {
      this.videoNodes.push(node);
      node.kNode.on("dragend", this.handleNodeDragEnd);
    } else if (node instanceof ImageNode || node instanceof TextNode) {
      this.imageNodes.push(node);
      node.kNode.on("dragend", this.handleNodeDragEnd);
    }
  }

  public removeNodes(node: MediaNode) {
    if (node instanceof VideoNode) {
      const index = this.videoNodes.indexOf(node);
      if (index > -1) {
        node.kNode.off("dragend", this.handleNodeDragEnd);
        this.videoNodes.splice(index, 1);
      }
    } else if (node instanceof ImageNode || node instanceof TextNode) {
      const index = this.imageNodes.indexOf(node);
      if (index > -1) {
        node.kNode.off("dragend", this.handleNodeDragEnd);
        this.imageNodes.splice(index, 1);
      }
    }
  }

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

      const context = offScreenSceneCanvas.getContext();

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

  public async render() {
    // only pick nodes that intersect with the canvas on screen bounds to freeze.
    this.mediaLayerRef.draw();

    console.log(
      `context: x:${this.positionX} y:${this.positionY} ${this.width} x ${this.height}`,
    );

    const bitmap = (await this.renderFrame({
      layerOfInterest: this.mediaLayerRef,
      x: this.captureCanvas.x(),
      y: this.captureCanvas.y(),
      width: this.width,
      height: this.height,
      mimeType: "image/jpeg",
      pixelRatio: 1,
      quality: 1.0,
      test: false,
    })) as ImageBitmap;

    this.previewCanvas.image(bitmap);
  }
}
