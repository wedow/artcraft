import Konva from "konva";
import { Container } from "konva/lib/Container";
import { Shape } from "konva/lib/Shape";
import { Group } from "konva/lib/Group";

import { invoke } from "@tauri-apps/api/core";

import { FileUtilities } from "../FileUtilities/FileUtilities";
import { ImageNode, VideoNode, TextNode, ShapeNode, ShapeType } from "../Nodes";
import { MediaNode } from "../types";

import { RenderTask } from "./RenderTask";
import { OffScreenSceneCanvas } from "./OffScreenSceneCanvas";

// https://www.aiseesoft.com/resource/phone-aspect-ratio-screen-resolution.html#:~:text=16%3A9%20Aspect%20Ratio

export class RealTimeDrawEngine {
  private videoNodes: VideoNode[];
  private imageNodes: (ImageNode | TextNode | ShapeNode)[];

  private offScreenCanvas: OffscreenCanvas;
  private outputBitmap: ImageBitmap | undefined;

  // private frames: ImageBitmap[];

  // capturing composite within window

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

  public currentPrompt: string;
  public currentStrength: number;

  constructor({
    width,
    height,
    mediaLayerRef,
    offScreenCanvas,
  }: {
    width: number;
    height: number;
    mediaLayerRef: Konva.Layer;
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

    // this is the whole canvas
    this.mediaLayerRef = mediaLayerRef;

    // Set background layer to red and media layer to green for visibility

    this.port = undefined;

    this.fps = 24;

    this.currentPrompt = "";
    this.currentStrength = 100;
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

    this.previewCanvas = new Konva.Image({
      name: "PreviewCanvas",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      image: undefined,
      stroke: "black",
      strokeWidth: 1,
      draggable: false,
      fill: "white",
    });

    this.mediaLayerRef.add(this.captureCanvas);
    this.mediaLayerRef.add(this.previewCanvas);
    // send back
    this.captureCanvas.setZIndex(0);
    this.previewCanvas.setZIndex(1);
    // Add mouse events for preview canvas copying
    //this.previewCopyListener();

  }

  public previewCopyListener() {
    this.previewCanvas.on('mousedown touchstart', () => {
      if (!this.outputBitmap) {
        console.log("No preview image to copy"); 
        return;
      }
      
      // TODO create it as a node.
      
      // const imageNode = new ImageNode({
      //   mediaLayerRef: this.mediaLayer,
      //   canvasPosition: this.renderEngine.captureCanvas.position(),
      //   canvasSize: this.renderEngine.captureCanvas.size(),
      //   imageFile: imageFile,
      //   selectionManagerRef: this.selectionManager,
      // });

      // Create draggable preview copy
      const previewCopy = new Konva.Image({
        x: this.previewCanvas.x(),
        y: this.previewCanvas.y(),
        width: this.width,
        height: this.height,
        image: this.outputBitmap,
        draggable: true,
        listening: true
      });

      this.mediaLayerRef.add(previewCopy);
      previewCopy.moveToTop();
      this.mediaLayerRef.draw();

      // Start dragging immediately
      previewCopy.startDrag();

      // Handle drag events
      previewCopy.on('dragmove', () => {
        this.mediaLayerRef.draw();
      });

      previewCopy.on('dragend', () => {
        const previewBox = previewCopy.getClientRect();
        const captureBox = this.captureCanvas.getClientRect();
        
        if (Konva.Util.haveIntersection(previewBox, captureBox)) {
          // Snap to capture canvas position
          previewCopy.position({
            x: this.captureCanvas.x(),
            y: this.captureCanvas.y()
          });
          this.mediaLayerRef.batchDraw();
        } else {
          // Remove if dropped outside capture area
          previewCopy.destroy();
          this.mediaLayerRef.batchDraw();
        }
      });
    });
  }

  public findImageNodeById(id: string): (ImageNode | TextNode | ShapeNode | undefined) {
    return this.imageNodes.find(node => {
      if (node.kNode) {
        return node.kNode.id() === id;
      }
      return false;
    });
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
    const padBetweenCaptureAndPreview = 2;
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

  public isProcessing = false;
  private handleNodeDragEnd = async () => {
    // Clean up any existing state
    if (this.isProcessing) {
      console.log("isProcessing Returning")
      return;
    }
    console.log("Node drag ended");
    this.isProcessing = true;
    await this.render();
  };
  
  public async addNodes(node: MediaNode) {
   
    if (node instanceof ImageNode || node instanceof TextNode || node instanceof ShapeNode) {
      console.debug("Adding node:", node);
      this.imageNodes.push(node);
      console.log(this.imageNodes)
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

  private async imageBitmapToBase64(imageBitmap: ImageBitmap): Promise<string> {
    // Create a temporary canvas
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    // Draw the ImageBitmap onto the canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    ctx.drawImage(imageBitmap, 0, 0);

    // Convert to base64
    const base64String = canvas.toDataURL("image/png");

    // Clean up
    canvas.remove();

    // Remove the data:image/png;base64, prefix if you want just the base64 string
    return base64String.split(",")[1];
  }

  private async base64ToImageBitmap(
    base64String: string,
  ): Promise<ImageBitmap> {
    // Create an image element
    const img = new Image();

    // Convert base64 to data URL if it doesn't include the prefix
    const dataUrl = base64String.startsWith("data:")
      ? base64String
      : `data:image/png;base64,${base64String}`;

    // Create a promise to handle the image loading
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const bitmap = await createImageBitmap(img);
          resolve(bitmap);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));

      // Set the source to trigger loading
      img.src = dataUrl;
    });
  }

  public async saveOutput() {
    if (!this.outputBitmap) {
      console.error("No output bitmap available to save");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.outputBitmap.width;
      canvas.height = this.outputBitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2D context");

      ctx.drawImage(this.outputBitmap, 0, 0);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      await FileUtilities.blobToFileJpeg(blob, "output");
    } catch (error) {
      console.error("Error saving output:", error);
    }
  }

  public async render() {
    // only pick nodes that intersect wi th the canvas on screen bounds to freeze.
    
    this.mediaLayerRef.draw();
    // Output all nodes in mediaLayerRef
    const nodes = this.mediaLayerRef.getChildren();
    console.log("All nodes in mediaLayer:", nodes);
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

    // Test code
    if (true) {
      this.outputBitmap = bitmap;
      this.previewCanvas.image(bitmap);
      this.isProcessing = false;
      return;
    }

    try {
      const base64Bitmap = await this.imageBitmapToBase64(bitmap);

      const base64BitmapResponse = await invoke("infer_image", {
        image: base64Bitmap,
        prompt: this.currentPrompt,
        strength: this.currentStrength,
      });

      console.log(base64BitmapResponse);
      const decoded = await this.base64ToImageBitmap(
        base64BitmapResponse as string,
      );

      this.outputBitmap = decoded;
      this.previewCanvas.image(decoded);
    } catch (error) {
      console.error("Error during image processing:", error);
    } finally {
      this.isProcessing = false;
    }
  }
}
