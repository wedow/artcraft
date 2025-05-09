import Konva from "konva";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { FileUtilities } from "../../utilities/FileUtilities";
import {
  ImageNode,
  TextNode,
  ShapeNode,
  PreviewCopyNode,
  PaintNode,
} from "../Nodes";
import { MediaNode } from "../types";
import { RenderTask } from "./RenderTask";

import {
  isLoadingVisible,
  loadingProgress,
} from "../../signals/uiEvents/loadingIndicator";

import { EncodeImageBitmapToBase64 } from "../../utilities/EncodeImageBitmapToBase64";
import { setCanvasRenderBitmap } from "../../signals/canvasRenderBitmap";

interface ServerSettings {
  model_path: string;
  lora_path?: string;
}

export class RealTimeDrawEngine {
  private imageNodes: (ImageNode | TextNode | ShapeNode | PaintNode)[];

  public offScreenCanvas: OffscreenCanvas;
  private outputBitmap: ImageBitmap | undefined;

  // private frames: ImageBitmap[];
  // capturing composite within window

  public mediaLayerRef: Konva.Layer;
  private drawingsLayer: Konva.Layer; // New Layer for Drawings

  private height: number;
  private width: number;
  private positionX: number;
  private positionY: number;
  private positionPreviewX: number;
  private positionPreviewY: number;

  private port: MessagePort | undefined;
  public captureCanvas: Konva.Rect;
  public backgroundRasterRect: Konva.Image;

  public fps: number = 24;

  public currentPrompt: string;
  public currentStrength: number;

  public lastRenderedBitmap: ImageBitmap | undefined;

  // Paint Color
  // paint Brush Size
  // has to exit out of paint mode when shape or image are used.
  public paintColor: string = "#000000";
  private brushSize: number = 5; // Default brush size

  public onDrawCallback?: (
    canvas: HTMLCanvasElement,
    lineBounds: {
      width: number;
      height: number;
      x: number;
      y: number;
    },
  ) => void;
  private offscreenRenderDiv: HTMLDivElement;

  private client: WebSocketClient | null = null;
  private isConnected: boolean = false;

  public backgroundColor: string = "#d2d2d2"; // off white
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
    onPreviewCopyCallback?: (previewCopy: Konva.Image) => void; // New Parameter
  }) {
    this.imageNodes = [];
    this.onDrawCallback = onDraw;

    // TODO: Make this dynamic and update this on change of canvas.
    this.width = width * 1.5;
    this.height = height * 1;

    this.positionX = window.innerWidth - this.width;
    this.positionY = window.innerHeight - this.height;

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
    this.currentStrength = 1;

    // This is captures a subset of the medialayer ref
    this.captureCanvas = new Konva.Rect({
      name: "CaptureCanvas",
      x: this.positionX,
      y: this.positionY,
      width: this.width,
      height: this.height,
      stroke: "blue",
      strokeWidth: 1,
      cornerRadius: 10,
      draggable: false,
    });

    this.offscreenRenderDiv = document.createElement("div");

    this.mediaLayerRef.add(this.captureCanvas);

    this.captureCanvas.setZIndex(0);

    this.listenToServerEvents();
  }

  public async listenToServerEvents() {
    listen("notification", (event) => {
      console.log(event);
      // Handle model download events
      const payload = event.payload as any;

      // Model download started
      if (payload.model_download_started) {
        const modelInfo = payload.model_download_started;
        console.log(
          `Model download started: ${modelInfo.model_name} (${modelInfo.model_type})`,
        );

        // Set up loading indicator
        isLoadingVisible.value = true;
        loadingProgress.value = 0;

        // Create fake progress updates
        const downloadTimer = setInterval(() => {
          loadingProgress.value += 2;
          // Cap at 95% until we get the completed event
          if (loadingProgress.value >= 95) {
            loadingProgress.value = 95;
            clearInterval(downloadTimer);
          }
        }, 500);
      }

      // Model download completed
      if (payload.model_download_complete) {
        const modelInfo = payload.model_download_complete;
        console.log(
          `Model download completed: ${modelInfo.model_name} (${modelInfo.model_type})`,
        );

        // Complete the loading progress
        loadingProgress.value = 100;

        // Hide loading indicator after a short delay
        setTimeout(() => {
          isLoadingVisible.value = false;
        }, 1000);
      }
    });
  }

  private isEnabled: boolean = false;
  private cleanupFunction: (() => void) | null = null;

  // this starts the python server
  public async startServer() {
    try {
      this.client = new WebSocketClient("ws://localhost:8765");

      // Set up message handlers
      this.client.onProgress((progress) => {
        console.log(
          `Progress: ${progress.message} (${progress.progress * 100}%)`,
        );
        if (progress.error) {
          console.error("Error:", progress.error);
        }
      });

      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        if (!this.client) return reject("Client not initialized");

        this.client.ws.onopen = () => {
          this.isConnected = true;
          resolve();
        };
        this.client.ws.onerror = (error) => reject(error);
      });

      // Load initial model
      await this.loadModel({
        model_path: "C:/Users/Tensor/Downloads/animagineXL40_v4Opt.safetensors",
        lora_path: "C:/Users/Tensor/Downloads/anyu_all.safetensors",
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      this.isConnected = false;
    }
  }

  private async loadModel(settings: ServerSettings) {
    if (!this.client || !this.isConnected) {
      throw new Error("Server not connected");
    }
    await this.client.loadModel(settings);
  }

  private updateCursor(stage: Konva.Stage) {
    // Create cursor canvas
    const cursorCanvas = document.createElement("canvas");
    const size = this.brushSize * 5; // Match the brush size used in drawing
    cursorCanvas.width = size * 2; // Double size for padding
    cursorCanvas.height = size * 2;

    const ctx = cursorCanvas.getContext("2d");
    if (!ctx) return;

    // Draw the outer circle with a light stroke
    ctx.beginPath();
    ctx.arc(size, size, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw the inner circle with a dark stroke
    ctx.beginPath();
    ctx.arc(size, size, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Convert to data URL
    const cursorUrl = cursorCanvas.toDataURL();

    // Apply custom cursor
    stage.container().style.cursor = `url(${cursorUrl}) ${size} ${size}, auto`;
  }

  public paintMode() {
    let isDrawing = false;
    let currentLine: Konva.Line | null = null;

    const stage = this.mediaLayerRef.getStage();
    if (!stage) return;

    // Initialize cursor
    this.updateCursor(stage);

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
        strokeWidth: this.brushSize * 5,
        lineCap: "round",
        lineJoin: "round",
        x: this.captureCanvas.x(),
        y: this.captureCanvas.y(),
        draggable: false,
      });
      this.drawingsLayer.moveToTop();
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
      //await this.render();
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
    this.disableDragging();
    if (!this.cleanupFunction) {
      this.paintMode();
    }
    // Update cursor when enabling paint mode
    const stage = this.mediaLayerRef.getStage();
    if (stage) {
      this.updateCursor(stage);
    }
  }

  public enableDragging() {
    // Enable dragging for all nodes in media layer
    this.imageNodes?.forEach((node) => {
      console.log("Image Nodes Enable");
      console.log(node);
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
    this.enableDragging();
    if (this.cleanupFunction) {
      this.cleanupFunction();
      this.cleanupFunction = null;
    }
    // Reset cursor when disabling paint mode
    const stage = this.mediaLayerRef.getStage();
    if (stage) {
      stage.container().style.cursor = "default";
    }
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
    console.log("updateCaptureCanvas");
    if (!this.captureCanvas) {
      return;
    }
    const scaleFactor = 0.9;
    // Store old values for calculating delta
    const oldPositionX = this.positionX;
    const oldPositionY = this.positionY;

    const oldWidth = this.width;
    const oldHeight = this.height;

    // Original aspect ratio
    const originalAspectRatio = oldWidth / oldHeight;

    // Calculate new dimensions based on window size
    let newWidth: number;
    let newHeight: number;

    if (width === undefined) {
      newWidth = window.innerWidth * scaleFactor;
    } else {
      newWidth = width * scaleFactor;
    }

    if (height === undefined) {
      newHeight = window.innerHeight * scaleFactor;
    } else {
      newHeight = height * scaleFactor;
    }

    // Preserve aspect ratio
    const newAspectRatio = newWidth / newHeight;

    if (newAspectRatio > originalAspectRatio) {
      // Width is constraining factor
      newWidth = newHeight * originalAspectRatio;
    } else {
      // Height is constraining factor
      newHeight = newWidth / originalAspectRatio;
    }

    this.width = newWidth;
    this.height = newHeight;

    console.log("New dimensions:", this.width, this.height);

    // Calculate new position to center the canvas in the window
    this.positionX = (window.innerWidth - this.width) / 2;
    const headerPadding = 56;
    this.positionY = (window.innerHeight - headerPadding - this.height) / 2;

    console.log("New centered position:", this.positionX, this.positionY);

    // Update the canvas position and size
    this.captureCanvas.setPosition({
      x: this.positionX,
      y: this.positionY,
    });
    this.captureCanvas.size({ width: this.width, height: this.height });

    // Calculate scale factors to maintain proportions
    const scaleX = this.width / oldWidth;
    const scaleY = this.height / oldHeight;

    // Use a uniform scale factor to preserve aspect ratio
    const uniformScale = Math.min(scaleX, scaleY);

    // Update all children except the capture canvas
    var children = this.mediaLayerRef.getChildren();
    for (let i = 0; i < children.length; i++) {
      let node = children[i];

      // skip the capture canvas and preview canvas update.
      if (node.name() === "CaptureCanvas") {
        continue;
      }

      const pos = node.getPosition();
      const oldScale = node.scale();

      // Apply both position shift and scaling to maintain relative positioning
      node.setPosition({
        x: (pos.x - oldPositionX) * uniformScale + this.positionX,
        y: (pos.y - oldPositionY) * uniformScale + this.positionY,
      });

      // Update scale proportionally if the node has a scale property
      if (
        oldScale &&
        typeof oldScale.x === "number" &&
        typeof oldScale.y === "number"
      ) {
        node.scale({
          x: oldScale.x * uniformScale,
          y: oldScale.y * uniformScale,
        });
      }
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
    //await this.render();
  };

  public async addNodes(node: MediaNode) {
    if (
      node instanceof ImageNode ||
      node instanceof TextNode ||
      node instanceof ShapeNode ||
      node instanceof PaintNode ||
      node instanceof PreviewCopyNode
    ) {
      console.debug("Adding node:", node);
      this.imageNodes.push(node);
      console.log(this.imageNodes);
    }

    // ensure the layer doesn't move if added while painting.
    if (this.isEnabled) {
      this.disableDragging();
    }

    //await this.render();
  }

  public removeNodes(node: MediaNode) {
    if (
      node instanceof ImageNode ||
      node instanceof TextNode ||
      node instanceof ShapeNode ||
      node instanceof PaintNode ||
      node instanceof PreviewCopyNode
    ) {
      const index = this.imageNodes.indexOf(node);
      if (index > -1) {
        node.kNode.off("dragend", this.handleNodeDragEnd);
        this.imageNodes.splice(index, 1);
      }
    }
  }

  private cloneStageForRender(
    stage: Konva.Stage,
    layerOfInterest: Konva.Layer,
  ): Konva.Stage {
    const stageClone = new Konva.Stage({
      width: stage.width(),
      height: stage.height(),
      container: this.offscreenRenderDiv,
    });

    const renderLayer = new Konva.Layer();

    // Clone all the nodes then reset them to render right
    layerOfInterest.getChildren().forEach((node) => {
      const dupNode = node.clone();
      dupNode.strokeWidth(0);
      renderLayer.add(dupNode);
    });

    stageClone.add(renderLayer);

    return stageClone;
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

  public async saveOutput() {
    if (!this.outputBitmap) {
      console.error("No output bitmap available to save");
      return;
    }

    const base64Bitmap = await EncodeImageBitmapToBase64(this.outputBitmap);

    const saveResponse = await invoke("save_image", {
      image: base64Bitmap,
    });
  }

  public async generateImage() {
    if (!this.lastRenderedBitmap) {
      console.error("No rendered bitmap available to generate from");
      return;
    }

    const base64Bitmap = await this.imageBitmapToBase64(
      this.lastRenderedBitmap,
    );

    const generateResponse = await invoke("image_generation_command", {
      image: base64Bitmap,
      prompt: this.currentPrompt,
    });
  }

  public async render() {
    // only pick nodes that intersect wi th the canvas on screen bounds to freeze.
    if (this.isProcessing) {
      console.log("isProcessing Returning");
      return;
    }
    console.log("Calling Render");
    this.isProcessing = true;

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

    this.lastRenderedBitmap = bitmap;

    setCanvasRenderBitmap(bitmap);

    try {
    } catch (error) {
      console.error("Error during image processing:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Add getter/setter for brush size
  public set paintBrushSize(size: number) {
    this.brushSize = size * 7.5;
    const stage = this.mediaLayerRef.getStage();
    if (stage && this.isEnabled) {
      this.updateCursor(stage);
    }
  }

  public get paintBrushSize(): number {
    return this.brushSize;
  }

  // Add method to check connection status
  public isServerConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Add method to reconnect if needed
  public async reconnect() {
    if (this.client) {
      this.client.ws.close();
    }
    await this.startServer();
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
    const box = config.layerOfInterest.getClientRect();
    const stage = config.layerOfInterest.getStage();

    const x = config.x !== undefined ? config.x : Math.floor(box.x);
    const y = config.y !== undefined ? config.y : Math.floor(box.y);
    const pixelRatio = config.pixelRatio || 1;

    // Clone the required layer from the stage
    // Set the right details (like removing highlight stroke)
    // Then render the cloned stage to a bitmap
    const stageClone = this.cloneStageForRender(stage, config.layerOfInterest);
    const stageBlob = (await stageClone.toBlob({
      x: x,
      y: y,
      width: config.width || Math.ceil(box.width),
      height: config.height || Math.ceil(box.height),
      pixelRatio: pixelRatio,
    })) as Blob;

    // if config.test is true, the result is downloaded to the local files
    // config.test = true;
    if (config.test) {
      await FileUtilities.blobToFileJpeg(stageBlob, "1");
    }

    const result = await createImageBitmap(stageBlob);
    return result;
  }

  // Add method to create or update background
  public updateBackground(color: string) {
    this.captureCanvas.fill(color);

    const captureCanvasImage = this.captureCanvas.toDataURL();
    const imageSource = new Image();
    imageSource.src = captureCanvasImage;

    imageSource.onload = () => {
      this.backgroundRasterRect.fill(color);
      this.backgroundRasterRect.image(imageSource);

      this.mediaLayerRef.batchDraw();
      //this.render();
    };
  }
}
