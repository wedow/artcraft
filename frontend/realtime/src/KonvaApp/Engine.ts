import Konva from "konva";

import { uiAccess, uiEvents } from "~/signals";
import { ShapeNode } from "./Nodes";
import { PaintNode } from "./Nodes/PaintNode";
import { PreviewCopyNode } from "./Nodes/PreviewCopy";
import { UndoStackManager } from "./UndoRedo";
import { CommandManager, MatteBox, SceneManager } from "./EngineUtitlities";
import {
  NodesManager,
  NodeIsolator,
  NodeTransformer,
  NodesTranslationEventDetails,
  NodeTransformationEventDetails,
  SelectionManager,
  SelectionManagerEvents,
  SelectorSquare,
} from "./NodesManagers";
import { ImageNode, VideoNode, TextNode } from "./Nodes";
import { EngineOptions, TextNodeData, VideoNodeData } from "./types";

import { AppModes, VideoResolutions } from "./constants";
import { ToolbarMainButtonNames } from "~/components/features/ToolbarMain/enum";

import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode/enums";
import { NavigateFunction } from "react-router-dom";
import { LoadingVideosProvider } from "./EngineUtitlities/LoadingVideosProvider";

import { VideoExtractionHandler } from "./EngineUtitlities/VideoExtractionHandler/VideoExtractionHandler";
import { RealTimeDrawEngine } from "./RenderingPrimitives/RealTimeDrawEngine";
import { NodeColor } from "~/signals/uiEvents/toolbarNode";
import { ShapeType } from "./Nodes";


export interface RenderingOptions {
  artstyle: string;
  positivePrompt: string;
  negativePrompt: string;
  cinematic: boolean;
  enginePreProcessing: boolean;
  faceDetail: boolean;
  lipSync: boolean;
  upscale: boolean;
  styleStrength: number;
}

export class Engine {
  private navigateRef: NavigateFunction;
  private appMode: AppModes = AppModes.INIT;
  private boardCanvasRef: HTMLDivElement;
  private stage: Konva.Stage;
  private bgLayer: Konva.Layer;
  private mediaLayer: Konva.Layer;
  private nodeIsolationLayer: Konva.Layer;
  private uiLayer: Konva.Layer;
  private previewLayer: Konva.Layer;
  private offScreenCanvas: OffscreenCanvas;
  private realTimeDrawEngine: RealTimeDrawEngine;
  private nodesManager: NodesManager;
  private nodeIsolator: NodeIsolator;
  private nodeTransformer: NodeTransformer;
  private selectionManager: SelectionManager;
  private selectorSquare: SelectorSquare;
  private loadingVideosProvider: LoadingVideosProvider;
  private matteBox: MatteBox;
  private backgroundNode: ShapeNode | null = null;

  private sceneManager: SceneManager;
  private undoStackManager: UndoStackManager;
  private commandManager: CommandManager;
  private videoExtractionHandler: VideoExtractionHandler;

  public segmentationButtonCanBePressed: boolean = true;
  // signal reference
  constructor(boardCanvasRef: HTMLDivElement, options: EngineOptions) {
    if (import.meta.env.DEV) {
      console.log("Engine Created");
    }
    this.navigateRef = options.navigate;
    this.appMode = AppModes.SELECT;

    this.boardCanvasRef = boardCanvasRef;
    this.stage = new Konva.Stage({
      container: this.boardCanvasRef,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    this.bgLayer = new Konva.Layer();

    this.mediaLayer = new Konva.Layer();
    this.previewLayer = new Konva.Layer();

    this.nodeIsolationLayer = new Konva.Layer();
    this.uiLayer = new Konva.Layer();

    this.stage.add(this.bgLayer);
    this.stage.add(this.previewLayer);
    this.stage.add(this.mediaLayer);
    this.stage.add(this.nodeIsolationLayer);
    this.stage.add(this.uiLayer);

    // Konva Transformer
    this.nodeTransformer = new NodeTransformer();
    this.uiLayer.add(this.nodeTransformer.getKonvaNode());
    // Loading Placeholders
    this.loadingVideosProvider = new LoadingVideosProvider();
    // Node Isolator
    this.nodeIsolator = new NodeIsolator({
      mediaLayerRef: this.mediaLayer,
      nodeIsolationLayerRef: this.nodeIsolationLayer,
    });

    // core layer for all the work done.
    this.offScreenCanvas = new OffscreenCanvas(0, 0);

    // Collection of all Nodes
    this.nodesManager = new NodesManager();
    // Partial Collection of selected Nodes
    this.selectionManager = new SelectionManager({
      nodeTransformerRef: this.nodeTransformer,
      mediaLayerRef: this.mediaLayer,
    });

    this.realTimeDrawEngine = new RealTimeDrawEngine({
      width: VideoResolutions.SQUARE_1024.width,
      height: VideoResolutions.SQUARE_1024.height,
      mediaLayerRef: this.mediaLayer,
      offScreenCanvas: this.offScreenCanvas,
      onDraw: async (canvas, lineBounds) => {
        await this.addPaintNode(canvas, lineBounds);
      },
      onPreviewCopy: async (image) => {
        await this.addPreviewCopy(image);
      },
    });

    // Selector Square to select Nodes
    this.selectorSquare = new SelectorSquare({
      captureCanvasRef: this.realTimeDrawEngine.captureCanvas,
      mediaLayerRef: this.mediaLayer,
      nodesManagerRef: this.nodesManager,
      selectionManagerRef: this.selectionManager,
      stageRef: this.stage,
    });
    this.uiLayer.add(this.selectorSquare.getKonvaNode());

    //Collection of commands for undo-redo
    this.undoStackManager = new UndoStackManager(() => {
      this.realTimeDrawEngine.render();
    });
    this.commandManager = new CommandManager({
      mediaLayerRef: this.mediaLayer,
      nodesManagerRef: this.nodesManager,
      nodeTransformerRef: this.nodeTransformer,
      selectionManagerRef: this.selectionManager,
      renderEngineRef: this.realTimeDrawEngine,
      undoStackManagerRef: this.undoStackManager,
    });

    // set up secene manager
    this.sceneManager = new SceneManager({
      navigateRef: this.navigateRef,
      loadingVideosProviderRef: this.loadingVideosProvider,
      mediaLayerRef: this.mediaLayer,
      nodesManagerRef: this.nodesManager,
      selectionManagerRef: this.selectionManager,
      renderEngineRef: this.realTimeDrawEngine,
    });
    this.videoExtractionHandler = new VideoExtractionHandler({
      nodeIsolatorRef: this.nodeIsolator,
      selectionManagerRef: this.selectionManager,
      selectorSquareRef: this.selectorSquare,
      undoStackManagerRef: this.undoStackManager,
      commandManagerRef: this.commandManager,
    });
    this.matteBox = new MatteBox({
      boardCanvasSize: {
        width: this.boardCanvasRef.clientWidth,
        height: this.boardCanvasRef.clientHeight,
      },
      captureCanvasSize: this.realTimeDrawEngine.captureCanvas.getSize(),
      uiLayerRef: this.uiLayer,
    });

    // some of the managers has events
    // hence, lastly, setup these events
    this.setupEventSystem();
    this.setAppMode(this.appMode);
  }

  private setAppMode(newAppMode: AppModes) {
    this.appMode = newAppMode;
    switch (this.appMode) {
      case AppModes.PAINT: {
        console.log("APPMODE: PAINT");
        this.selectorSquare.disable(); // this breaks the paint if you use it in the wrong spot
        this.selectionManager.disable(); // this prevents selection.
        this.realTimeDrawEngine.enablePaintMode();

        uiAccess.toolbarMain.enable();
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.SELECT, {
          active: false,
        });
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.PAINT, {
          active: true,
        });
        this.matteBox.disable();
        return;
      }
      case AppModes.SELECT: {
        console.log("APPMODE: SELECT");
        this.realTimeDrawEngine.disablePaintMode();

        this.selectorSquare.enable();
        this.selectionManager.enable();
        uiAccess.toolbarMain.enable();
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.SELECT, {
          active: true,
        });
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.PAINT, {
          active: false,
        });
        this.matteBox.disable();
        document.body.style.cursor = "default";
        return;
      }
      case AppModes.PREVIEW: {
        console.log("APPMODE: RENDER");
        this.selectorSquare.disable();
        this.selectionManager.disable();
        uiAccess.toolbarMain.disable();
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.SELECT, {
          active: false,
        });
        this.matteBox.enable();
        document.body.style.cursor = "not-allowed";
        return;
      }
      case AppModes.RENDERING: {
        console.log("APPMODE: RENDER");
        this.selectorSquare.disable();
        this.selectionManager.disable();
        uiAccess.toolbarMain.disable();
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.SELECT, {
          active: false,
        });
        this.matteBox.enable(true);
        document.body.style.cursor = "wait";
        return;
      }
      case AppModes.INIT:
      default: {
        console.log("APPMODE: INIT");
        this.selectorSquare.disable();
        uiAccess.toolbarMain.disable();
        this.selectionManager.disable();
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.SELECT, {
          active: false,
        });
        document.body.style.cursor = "wait";
        this.matteBox.disable();
      }
    }
  }
  private setupEventSystem() {
    // Listen to changes in container size
    const resizeObserver = new ResizeObserver(() => {
      this.onBoardCanvasResize();
    });
    resizeObserver.observe(this.boardCanvasRef);
    this.onBoardCanvasResize();

    // Listen to Nodes
    this.selectionManager.eventTarget.addEventListener(
      SelectionManagerEvents.NODES_TRANSLATIONS,
      ((event: CustomEvent<NodesTranslationEventDetails>) => {
        //console.log("Event: SelectionManager -> Engine", event);
        this.commandManager.translateNodes(event.detail);
      }) as EventListener,
    );
    this.selectionManager.eventTarget.addEventListener(
      SelectionManagerEvents.NODES_TRANSFORMATION,
      ((event: CustomEvent<NodeTransformationEventDetails>) => {
        //console.log("Event: SelectionManager -> Engine", event);
        this.commandManager.transformNodes(event.detail);
      }) as EventListener,
    );

    // Listen to Tooolbar Node
    uiEvents.toolbarNode.lock.onClick(() => {
      this.commandManager.toggleLockNodes();
    });
    uiEvents.toolbarNode.DOWNLOAD.onClick(() => {
      const nodes = this.selectionManager.getSelectedNodes();
      if (nodes.size > 1) {
        uiAccess.dialogError.show({
          title: "Error: Download Node Content",
          message:
            "Please do not select more than 1 item for the Download Node Content feature, you can only download 1 item at a time",
        });
        return;
      }
      const node = nodes.values().next().value;
      try {
        if (node instanceof VideoNode && node.currentUrl) {
          downloadURI(node.currentUrl, `Download Video Node-${node.kNode.id}`);
        } else {
          throw new Error();
        }
      } catch {
        uiAccess.dialogError.show({
          title: "Error: Download Node Content",
          message: "This item does not have content for download.",
        });
      }
    });
   

  
    uiEvents.toolbarNode.DELETE.onClick(() =>
      this.commandManager.deleteNodes(),
    );
    uiEvents.toolbarNode.MOVE_LAYER_DOWN.onClick(() =>
      this.commandManager.moveNodesDown(),
    );
    uiEvents.toolbarNode.MOVE_LAYER_UP.onClick(() =>
      this.commandManager.moveNodesUp(),
    );

    // Listen to Toolbar Main
    uiEvents.toolbarMain.UNDO.onClick(() => {
      this.undoStackManager.undo();
    });
    uiEvents.toolbarMain.REDO.onClick(() => {
      this.undoStackManager.redo();
      this.realTimeDrawEngine.render();
    });

    uiEvents.toolbarMain.SAVE.onClick(async (/*event*/) => {
      await this.realTimeDrawEngine.saveOutput();
    });

    uiEvents.toolbarMain.SELECT.onClick(() => {
      console.log("Toolbar Main >> Select");
      this.setAppMode(AppModes.SELECT);
    });

    uiEvents.toolbarMain.PAINT.onClick(() => {
      console.log("Toolbar Main >> Paint");
      this.setAppMode(AppModes.PAINT);
    });

    uiEvents.toolbarMain.ERASER.onClick(() => {
      console.log("Toolbar Main >> Eraser");
    });

    uiEvents.toolbarMain.PREVIEW.onClick(async () => {
      console.log("Toolbar Main >> Preview");
      this.setAppMode(AppModes.PREVIEW);
      await this.handlePreview();
      this.setAppMode(AppModes.SELECT);
    });
    uiEvents.toolbarMain.DOWNLOAD.onClick(async () => {
      console.log("Toolbar Main >> Render Download");
      try {
        this.setAppMode(AppModes.RENDERING);
      } catch (error) {
        // throw error to retry
        uiAccess.dialogError.show({
          title: "Generation Error",
          message: error?.toString() || "Unknown Error",
        });
        this.setAppMode(AppModes.SELECT);
      }
    });
    // Listen to other toolbars
    // VideoExtraction Toolbar
    this.videoExtractionHandler.listenToToolbarEvents();

    // Listen to other requests coming from the UI
    uiEvents.onGetStagedImage((image) => {
      this.addImage(image);
    });

    uiEvents.onAddTextToEngine((textdata) => {
      this.addText(textdata);
    });

   
    let renderTimeout: NodeJS.Timeout;

    uiEvents.promptEvents.onPromptStrengthChanged(async (strength) => {
      this.realTimeDrawEngine.currentStrength = strength / 100.0;
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(async () => {
        await this.realTimeDrawEngine.render();
      }, 1000);
    });

    uiEvents.promptEvents.onPromptTextChanged(async (prompt) => {
      this.realTimeDrawEngine.currentPrompt = prompt;
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(async () => {
        await this.realTimeDrawEngine.render();
      }, 1000);
    });

    uiEvents.onAddShapeToEngine((shapeData) => {
      switch (shapeData.shape) {
        case "circle":
          this.addShape(ShapeType.CIRCLE, 100);
          break;
        case "square":
          this.addShape(ShapeType.SQUARE, 100);
          break;
        case "triangle":
          this.addShape(ShapeType.TRIANGLE, 100);
          break;
      }
    });


    uiEvents.toolbarMain.onBgColorChanged((data)=>{
      this.realTimeDrawEngine.updateBackground(data);
    });

    uiEvents.toolbarNode.color.onConfirmChanged((nodeColor) => {
      console.log("Color change event triggered with:", nodeColor);
      if (!nodeColor) {
        console.warn("nodeColor is undefined or null");
        return;
      }
      if (!nodeColor.kNodeId) {
        console.warn("nodeColor.kNodeId is undefined or null");
        return;
      }
      this.changeNodeColor(nodeColor);
    });
    uiEvents.toolbarMain.onPaintColorChanged((color) => {
      this.realTimeDrawEngine.paintColor = color;
    });

    uiEvents.toolbarMain.onEraseBrushSizeChanged((size: number) => {
      this.realTimeDrawEngine.paintBrushSize = size;
    });
  }

  disableAllButtons() {
    const buttonNames = Object.values(ToolbarNodeButtonNames);
    for (const name of buttonNames) {
      uiAccess.toolbarNode.changeButtonState(name, { disabled: true });
    }
  }

  async enableAllButtons() {
    const buttonNames = Object.values(ToolbarNodeButtonNames);
    for (const name of buttonNames) {
      await uiAccess.toolbarNode.changeButtonState(name, { disabled: false });
    }
  }

  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private onBoardCanvasResize() {
    this.realTimeDrawEngine.updateCaptureCanvas(undefined, undefined);
    this.matteBox.updateSize({
      boardCanvasSize: {
        width: this.boardCanvasRef.offsetWidth,
        height: this.boardCanvasRef.offsetHeight,
      },
    });
    this.uiLayer.draw();
    this.stage.width(this.boardCanvasRef.offsetWidth);
    this.stage.height(this.boardCanvasRef.offsetHeight);
    this.stage.draw(); // Redraw the canvas
  }

  // Sandbox is quickly a way to test your idea.
  public async sandbox() {}

  public onMessage(event: MessageEvent) {
    console.log("Message From Shared Worker");
    console.log(event);
  }

  public initializeStage(sceneToken?: string) {
    // load canvas that was originaly saved TODO Save manager for resharing.
    uiAccess.toolbarNode.hide();
    uiAccess.loadingBar.hide();
    // load the scene if there's a scenetoken
    if (sceneToken) {
      this.sceneManager.loadScene(sceneToken);
    }
    this.setupStage();
    // this.populateWithDebugItems();
  }
  public isInitialized() {
    return this.stage !== null;
  }

  public async setupStage() {
    // Frame rate inicator
    const textNode = new Konva.Text({
      x: 10,
      y: 80,
      text: "",
      fontSize: 18,
      fontFamily: "Source Sans 3",
      fill: "white",
    });
    const anim = new Konva.Animation((frame) => {
      if (frame && import.meta.env.DEV) {
        const timeDiff = frame.timeDiff;
        const frameRate = frame.frameRate;
        textNode.setText(
          `FrameTime: ${timeDiff.toFixed(0)} ms\nFrameRate: ${frameRate.toFixed(0)} fps`,
        );
      }
    }, this.mediaLayer);

    anim.start();
    this.uiLayer.add(textNode);
    this.addKeyboardShortcuts();
  }

  private changeNodeColor(nodeColor: NodeColor) {
    console.log("Changing node color:", nodeColor);
    // Find the node that is selected with the id
    const idSelector = "#" + nodeColor.kNodeId;
    const selectedNode = this.mediaLayer.findOne(idSelector);
    console.log("Selected node:", selectedNode);
    console.log("ID selector:", idSelector);
    console.log("Media layer:", this.mediaLayer);
    // TODO: Change the color of the node
    // Turns out shapes are image nodes... how do we change the image's fill??
    if (selectedNode) {
      // Get the shape node from the real time drawing engine's image nodes
      const shapeNode = this.realTimeDrawEngine.findImageNodeById(
        nodeColor.kNodeId,
      );
      if (shapeNode && shapeNode instanceof ShapeNode) {
        // Create new shape node with updated color
        const newShapeNode = new ShapeNode({
          canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
          canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
          shapeType: shapeNode.shapeType,
          size: shapeNode.kNode.size(),
          color: nodeColor.color,
          mediaLayerRef: this.mediaLayer,
          selectionManagerRef: this.selectionManager,
          loaded: async () => {
            this.realTimeDrawEngine.render();
          },
        });
        newShapeNode.kNode.position(shapeNode.kNode.position());
        newShapeNode.kNode.zIndex(shapeNode.kNode.zIndex());

        // Remove old node and add new one
        shapeNode.kNode.destroy();
        this.commandManager.createNode(newShapeNode);
      }
    }
  }

  public addText(textNodeData: TextNodeData) {
    const textNode = new TextNode({
      textNodeData: textNodeData,
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
      canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
    });
    this.commandManager.createNode(textNode);
  }

  public addShape(type: ShapeType, size: number, color?: string) {

    const shapeNode = new ShapeNode({
      canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
      canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
      shapeType: type,
      size: { width: size, height: size },
      color: color,
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      loaded: async () => {
        await this.realTimeDrawEngine.render();
        this.setAppMode(AppModes.SELECT);
      },
    });

    this.commandManager.createNode(shapeNode);

    console.debug("Added shapenode:", shapeNode);
    console.debug("Added node's ID:", shapeNode.kNode._id);
  }
  public addPreviewCopy(image: Image.Konva) {
    // Start of Selection
    const copyNode = new PreviewCopyNode({
      image: image,
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      loaded: async () => {
        this.realTimeDrawEngine.render();
        this.setAppMode(AppModes.SELECT);
      },
    });
    this.commandManager.createNode(copyNode);
  }
  public addImage(imageFile: File) {
    const imageNode = new ImageNode({
      mediaLayerRef: this.mediaLayer,
      canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
      canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
      imageFile: imageFile,
      selectionManagerRef: this.selectionManager,
      loaded: async () => {
        await this.realTimeDrawEngine.render();
        this.setAppMode(AppModes.SELECT);
      },
    });

    this.commandManager.createNode(imageNode);
  }
  public addPaintNode(
    canvas: HTMLCanvasElement,
    lineBounds: {
      width: number;
      height: number;
      x: number;
      y: number;
    },
  ) {
    var node = new PaintNode({
      canvasElement: canvas,
      lineBounds: lineBounds,
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      loaded: async () => {
        await this.realTimeDrawEngine.render();
      },
    });
    this.commandManager.createNode(node);
  }

  public addVideo(
    videNodeData: Partial<VideoNodeData> & { mediaFileUrl: string },
  ) {
    const videoNode = new VideoNode({
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      loadingVideosProviderRef: this.loadingVideosProvider,
      canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
      canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
      videoNodeData: videNodeData,
    });
    this.commandManager.createNode(videoNode);
  }

  // Events for Undo and Redo
  private addKeyboardShortcuts() {
    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "z") {
        this.undoStackManager.undo();
      } else if (
        (event.ctrlKey && event.key === "y") ||
        (event.ctrlKey && event.shiftKey && event.key === "Z")
      ) {
        this.undoStackManager.redo();
      } else if (event.key === "Delete") {
        this.commandManager.deleteNodes();
      }
    });
  }

  private async handlePreview(): Promise<void> {
    return new Promise((resolve) => {
      const allNodes = this.nodesManager.getAllNodes();
      let longestVideoNode: VideoNode | undefined;
      allNodes.forEach((node) => {
        if (node instanceof VideoNode) {
          node.videoComponent.pause();
          node.videoComponent.currentTime = 0;
          if (
            longestVideoNode === undefined ||
            node.videoComponent.duration >
              longestVideoNode.videoComponent.duration
          ) {
            longestVideoNode = node;
          }
        }
      });
      const timer = setTimeout(() => {
        resolve();
      }, 7000);
      if (longestVideoNode !== undefined) {
        longestVideoNode.videoComponent.addEventListener("ended", () => {
          clearTimeout(timer);
          resolve();
        });
      } else {
        // no videonode
        uiAccess.dialogError.show({
          title: "No Video Node",
          message: "You have not yet put a video on the board",
        });
        resolve();
      }
      allNodes.forEach((node) => {
        if (node instanceof VideoNode) {
          node.togglePlay();
        }
      });
    });
  }
}

function downloadURI(uri: string, name: string) {
  const link = document.createElement("a");
  link.download = name;
  link.target = "_blank";
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
