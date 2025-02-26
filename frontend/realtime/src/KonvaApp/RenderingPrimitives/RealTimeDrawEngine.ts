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
import { Image } from "@tauri-apps/api/image";

import { PaintNode } from "../Nodes/PaintNode";

import {
  ServerSetupPayload,
  ServerSettingsPayload,
  ServerResponse,
} from "../types/ServerTypes";

// https://www.aiseesoft.com/resource/phone-aspect-ratio-screen-resolution.html#:~:text=16%3A9%20Aspect%20Ratio

export class RealTimeDrawEngine {
  private videoNodes: VideoNode[];
  private imageNodes: (ImageNode | TextNode | ShapeNode | PaintNode)[];

  private offScreenCanvas: OffscreenCanvas;
  private outputBitmap: ImageBitmap | undefined;

  // private frames: ImageBitmap[];

  // capturing composite within window

  private mediaLayerRef: Konva.Layer;
  private drawingsLayer: Konva.Layer; // New Layer for Drawings

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

  // Paint Color
  // paint Brush Size
  // has to exit out of paint mode when shape or image are used.
  public paintColor: string = "#000000";
  public paintBrushSize: number = 5;
  public isPaintMode: boolean = false;

  private onDrawCallback?: (
    canvas: HTMLCanvasElement,
    lineBounds: {
      width: number;
      height: number;
      x: number;
      y: number;
    },
  ) => void;

  private onPreviewCopyCallback?: (previewCopy: Konva.Image) => void; // New Callback

  private serverSocket: WebSocket | null = null;

  constructor({
    width,
    height,
    mediaLayerRef,
    offScreenCanvas,
    onDraw,
    onPreviewCopy, // New Parameter
  }: {
    width: number;
    height: number;
    mediaLayerRef: Konva.Layer;
    offScreenCanvas: OffscreenCanvas;
    onDraw?: (
      canvas: HTMLCanvasElement,
      lineBounds: {
        width: number;
        height: number;
        x: number;
        y: number;
      },
    ) => void;
    onPreviewCopy?: (previewCopy: Konva.Image) => void; // New Parameter
  }) {
    this.videoLoadingCanvas = undefined;
    this.videoNodes = [];
    this.imageNodes = [];
    this.onDrawCallback = onDraw;
    this.onPreviewCopyCallback = onPreviewCopy; // Assign Callback

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

    // Create a separate layer for drawings
    this.drawingsLayer = new Konva.Layer({
      clearBeforeDraw: true, // Ensures transparent background
    });
    this.mediaLayerRef.getStage()?.add(this.drawingsLayer); // to od pass in stage

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

    //this.startServer();
  }

  private isEnabled: boolean = false;
  private cleanupFunction: (() => void) | null = null;

  // this starts the python server
  public startServer() {
    // Create WebSocket connection
    const socket = new WebSocket("ws://localhost:8765");

    // Setup event handlers
    socket.onopen = () => {
      console.log("Connected to inference server");
      // Send initial setup payload to load models
      const setupPayload: ServerSetupPayload = {
        type: "setup",
        model: {
          name: "stabilityai/sdxl-turbo",
          path: "F:/ComfyUI_windows_portable_nvidia/ComfyUI_windows_portable/ComfyUI/models/checkpoints/ponyDiffusionV6XL_v6StartWithThisOne.safetensors",
          precision: "fp16",
        },
        lora: {
          path: "F:/ComfyUI_windows_portable_nvidia/ComfyUI_windows_portable/ComfyUI/models/loras/LCM_LoRA_Weights_SDXL.safetensors",
          alpha: 0.75,
        },
        device: "cuda",
      };

      socket.send(JSON.stringify(setupPayload));
    };

    // Handle incoming messages from server
    socket.onmessage = (event) => {
      try {
        const response: ServerResponse = JSON.parse(event.data);
        console.log("Server response:", response);
        // Handle model loading progress updates
        if (response.type === "progress") {
          console.log(`Loading progress: ${response.percent}%`);
          // You might want to update UI with loading progress here
        }
        // Handle successful model load
        else if (
          response.type === "success" &&
          response.status === "model_loaded"
        ) {
          console.log("Model loaded successfully");
          // Enable UI elements that depend on model being loaded
        }
        // Handle image generation results
        else if (
          response.type === "success" &&
          response.status === "generation_complete"
        ) {
          if (response.image) {
            // Convert base64 image to ImageBitmap for preview
            this.base64ToImageBitmap(response.image).then((bitmap) => {
              this.outputBitmap = bitmap;
              this.previewCanvas.image(bitmap);
              this.mediaLayerRef.draw();
            });
          }
        }
      } catch (error) {
        console.error("Error parsing server response:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Disconnected from inference server");
    };

    // Store socket reference for later use
    this.serverSocket = socket;
  }

  // Add method to update model settings
  public updateServerSettings(settings: ServerSettingsPayload) {
    if (this.serverSocket && this.serverSocket.readyState === WebSocket.OPEN) {
      this.serverSocket.send(JSON.stringify(settings));
    } else {
      console.error(
        "Cannot update settings: Server connection not established",
      );
    }
  }

  public paintMode() {
    let isDrawing = false;
    let currentLine: Konva.Line | null = null;

    const startDrawing = (pos: { x: number; y: number }) => {
      if (!this.isEnabled) return;
      const stage = this.mediaLayerRef.getStage();
      if (!stage) return;

      // Convert pointer position to relative position within capture canvas
      const captureBox = this.captureCanvas.getClientRect();
      const relativeX = pos.x - captureBox.x;
      const relativeY = pos.y - captureBox.y;

      currentLine = new Konva.Line({
        points: [relativeX, relativeY],
        stroke: this.paintColor,
        strokeWidth: 5,
        lineCap: "round",
        lineJoin: "round",
        x: this.captureCanvas.x(),
        y: this.captureCanvas.y(),
        draggable: false,
      });

      this.drawingsLayer.add(currentLine); // Add to drawingsLayer
      isDrawing = true;
    };

    const draw = (pos: { x: number; y: number }) => {
      if (!this.isEnabled) return;
      if (!isDrawing || !currentLine) return;

      // Convert pointer position to relative position
      const captureBox = this.captureCanvas.getClientRect();
      const relativeX = pos.x - captureBox.x;
      const relativeY = pos.y - captureBox.y;

      const newPoints = currentLine.points().concat([relativeX, relativeY]);
      currentLine.points(newPoints);
      this.drawingsLayer.batchDraw();
    };

    const stopDrawing = () => {
      if (!this.isEnabled) return;
      if (!isDrawing || !currentLine) return;

      // Store current line before resetting state
      const lineToConvert = currentLine;

      // Reset drawing state immediately so we can start a new stroke
      isDrawing = false;
      currentLine = null;

      // Create a temporary layer to render the line
      const tempLayer = new Konva.Layer({
        clearBeforeDraw: true,
      });
      this.mediaLayerRef.getStage()?.add(tempLayer);
      tempLayer.add(lineToConvert);

      // Get the line canvas with transparent background
      // Get the bounding box of the line
      const lineBounds = lineToConvert.getClientRect();

      // Create canvas with just enough size to contain the line
      const lineCanvas = tempLayer.toCanvas({
        x: lineBounds.x,
        y: lineBounds.y,
        width: lineBounds.width,
        height: lineBounds.height,
        pixelRatio: 1,
      });

      if (this.onDrawCallback) {
        this.onDrawCallback(lineCanvas, lineBounds);
      }

      // Clean up
      lineToConvert.destroy();
      tempLayer.destroy();

      this.drawingsLayer.batchDraw();
    };

    // Check if point is within capture canvas bounds
    const isWithinCaptureCanvas = (pos: { x: number; y: number }) => {
      const captureBox = this.captureCanvas.getClientRect();
      return (
        pos.x >= captureBox.x &&
        pos.x <= captureBox.x + captureBox.width &&
        pos.y >= captureBox.y &&
        pos.y <= captureBox.y + captureBox.height
      );
    };

    // Add event listeners
    const stage = this.mediaLayerRef.getStage();
    if (!stage) return;

    stage.on("mousedown touchstart", (e) => {
      const pos = stage.getPointerPosition();
      if (pos && isWithinCaptureCanvas(pos)) {
        startDrawing(pos);
      }
    });

    stage.on("mousemove touchmove", (e) => {
      const pos = stage.getPointerPosition();
      if (pos && isWithinCaptureCanvas(pos)) {
        draw(pos);
      }
    });

    stage.on("mouseup touchend", async () => {
      stopDrawing();
      await this.render();
    });

    // Store cleanup function
    this.cleanupFunction = () => {
      stage.off("mousedown touchstart");
      stage.off("mousemove touchmove");
      stage.off("mouseup touchend");
    };
  }

  public enablePaintMode() {
    this.isEnabled = true;
    if (!this.cleanupFunction) {
      this.paintMode();
    }
  }

  public enableDragging() {
    // Enable dragging for all nodes in media layer
    this.imageNodes?.forEach((node) => {
      node.kNode.draggable(true);
      node.kNode.listening(true);
    });
    this.mediaLayerRef.batchDraw();
  }

  public disableDragging() {
    // Disable dragging for all nodes in media layer
    this.imageNodes?.forEach((node) => {
      node.kNode.draggable(false);
      node.kNode.listening(false);
    });
    this.mediaLayerRef.batchDraw();
  }

  public disablePaintMode() {
    this.isEnabled = false;
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
  }

  public previewCopyListener() {
    this.previewCanvas.on("mousedown touchstart", () => {
      if (!this.outputBitmap) {
        console.log("No preview image to copy");
        return;
      }

      // Create draggable preview copy
      const previewCopy = new Konva.Image({
        x: this.previewCanvas.x(),
        y: this.previewCanvas.y(),
        width: this.width,
        height: this.height,
        image: this.outputBitmap,
        draggable: true,
        listening: true,
      });

      // this.drawingsLayer.add(previewCopy); // Add to drawingsLayer instead of mediaLayerRef
      // this.drawingsLayer.batchDraw();

      // Invoke the callback with the preview copy
      if (this.onPreviewCopyCallback) {
        this.onPreviewCopyCallback(previewCopy);
      }

      // Start dragging immediately
      previewCopy.startDrag();

      // Handle drag events
      previewCopy.on("dragmove", () => {
        // this.drawingsLayer.draw();
      });

      previewCopy.on("dragend", () => {
        const previewBox = previewCopy.getClientRect();
        const captureBox = this.captureCanvas.getClientRect();

        if (Konva.Util.haveIntersection(previewBox, captureBox)) {
          // Snap to capture canvas position
          previewCopy.position({
            x: this.captureCanvas.x(),
            y: this.captureCanvas.y(),
          });
          //this.drawingsLayer.batchDraw();
        } else {
          // Remove if dropped outside capture area
          //previewCopy.destroy();
          //this.drawingsLayer.batchDraw();
        }
      });
    });
  }

  public findImageNodeById(
    id: string,
  ): ImageNode | TextNode | ShapeNode | PaintNode | undefined {
    return this.imageNodes.find((node) => {
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
      console.log("isProcessing Returning");
      return;
    }
    console.log("Node drag ended");
    this.isProcessing = true;
    await this.render();
  };

  public async addNodes(node: MediaNode) {
    if (
      node instanceof ImageNode ||
      node instanceof TextNode ||
      node instanceof ShapeNode ||
      node instanceof PaintNode
    ) {
      console.debug("Adding node:", node);
      this.imageNodes.push(node);
      console.log(this.imageNodes);
      //node.kNode.on("dragend", this.handleNodeDragEnd);
    }

    // ensure the layer doesn't move if added while painting.
    if (this.isEnabled) {
      this.disableDragging();
    }

    await this.render();
  }

  public removeNodes(node: MediaNode) {
    if (node instanceof VideoNode) {
      const index = this.videoNodes.indexOf(node);
      if (index > -1) {
        node.kNode.off("dragend", this.handleNodeDragEnd);
        this.videoNodes.splice(index, 1);
      }
    } else if (
      node instanceof ImageNode ||
      node instanceof TextNode ||
      node instanceof ShapeNode ||
      node instanceof PaintNode
    ) {
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
    const img = document.createElement("img");

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
