import Konva from "konva";

import { RenderEngine } from "./RenderingPrimitives/RenderEngine";
import { ResponseType } from "./WorkerPrimitives/SharedWorkerBase";

import { uiAccess, uiEvents } from "~/signals";

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

import { SharedWorkerResponse } from "./WorkerPrimitives/SharedWorkerBase";
import {
  DiffusionSharedWorkerProgressData,
  DiffusionSharedWorkerResponseData,
} from "./SharedWorkers/Diffusion/DiffusionSharedWorker";

import { AppModes, VideoResolutions } from "./constants";
import { ToolbarMainButtonNames } from "~/components/features/ToolbarMain/enum";

import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode/enums";
import { NavigateFunction } from "react-router-dom";
import { LoadingVideosProvider } from "./EngineUtitlities/LoadingVideosProvider";
import { MediaFile } from "~/Classes/ApiManager/models/MediaFile";
import { VideoExtractionHandler } from "./EngineUtitlities/VideoExtractionHandler/VideoExtractionHandler";

// for testing loading files from system
// import { FileUtilities } from "./FileUtilities/FileUtilities";

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
  private renderEngine: RenderEngine;
  private offScreenCanvas: OffscreenCanvas;

  private nodesManager: NodesManager;
  private nodeIsolator: NodeIsolator;
  private nodeTransformer: NodeTransformer;
  private selectionManager: SelectionManager;
  private selectorSquare: SelectorSquare;
  private loadingVideosProvider: LoadingVideosProvider;
  private matteBox: MatteBox;

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
    this.nodeIsolationLayer = new Konva.Layer();
    this.uiLayer = new Konva.Layer();
    this.stage.add(this.bgLayer);
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

    this.renderEngine = new RenderEngine({
      width: VideoResolutions.VERTICAL_720.width,
      height: VideoResolutions.VERTICAL_720.height,
      mediaLayerRef: this.mediaLayer,
      bgLayerRef: this.bgLayer,
      offScreenCanvas: this.offScreenCanvas,
      onRenderingSystemMessageRecieved:
        this.onRenderingSystemReceived.bind(this),
    });

    // Collection of all Nodes
    this.nodesManager = new NodesManager();
    // Partial Collection of selected Nodes
    this.selectionManager = new SelectionManager({
      nodeTransformerRef: this.nodeTransformer,
      mediaLayerRef: this.mediaLayer,
    });
    // Selector Square to select Nodes
    this.selectorSquare = new SelectorSquare({
      captureCanvasRef: this.renderEngine.captureCanvas,
      mediaLayerRef: this.mediaLayer,
      nodesManagerRef: this.nodesManager,
      selectionManagerRef: this.selectionManager,
      stageRef: this.stage,
    });
    this.uiLayer.add(this.selectorSquare.getKonvaNode());

    // Collection of commands for undo-redo
    this.undoStackManager = new UndoStackManager();
    this.commandManager = new CommandManager({
      mediaLayerRef: this.mediaLayer,
      nodesManagerRef: this.nodesManager,
      nodeTransformerRef: this.nodeTransformer,
      selectionManagerRef: this.selectionManager,
      renderEngineRef: this.renderEngine,
      undoStackManagerRef: this.undoStackManager,
    });

    // set up secene manager
    this.sceneManager = new SceneManager({
      navigateRef: this.navigateRef,
      loadingVideosProviderRef: this.loadingVideosProvider,
      mediaLayerRef: this.mediaLayer,
      nodesManagerRef: this.nodesManager,
      selectionManagerRef: this.selectionManager,
      renderEngineRef: this.renderEngine,
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
      captureCanvasSize: this.renderEngine.captureCanvas.getSize(),
      uiLayerRef: this.uiLayer,
    });

    // some of the managers has events
    // hence, lastly, setup these events
    this.setupEventSystem();
    this.setAppMode(AppModes.SELECT);
  }

  // TODO write code to show error and retry.

  onRenderingSystemReceived(
    response: SharedWorkerResponse<
      DiffusionSharedWorkerResponseData | MediaFile,
      DiffusionSharedWorkerProgressData
    >,
  ) {
    if (!response.data) {
      // throw error to retry
      uiAccess.dialogError.show({
        title: "Generation Error",
        message: response.data?.toString(),
      });
      uiAccess.toolbarMain.loadingBar.hide();
      this.setAppMode(AppModes.SELECT);
      return;
    }

    if (response.responseType === ResponseType.error) {
      console.log("Error Data?");
      console.log(response.data, response);
      uiAccess.dialogError.show({
        title: "Generation Error Try again.",
        message: response.data?.toString(),
      });
      uiAccess.toolbarMain.loadingBar.hide();
      this.setAppMode(AppModes.SELECT);
      return;
    }

    if (response.responseType === ResponseType.result) {
      console.log(response.data);
      const data = response.data;
      // create video node here.
      // choose it to be the size of the rendering output, this case its mobile. (1560, 400)
      if (typeof data === "string" || data === undefined) {
        return;
      }
      if ("videoUrl" in data) {
        console.log("Engine got stylized video: " + data.videoUrl);
        this.addVideo({ mediaFileUrl: data.videoUrl });
      } else if ("media_links" in data) {
        console.log("Engine got rendered video: " + data.media_links.cdn_url);
        downloadURI(data.media_links.cdn_url, "Download Video");
      }

      // hide the loader
      //this.renderEngine.videoLoadingCanvas.kNode.hide();
      uiAccess.toolbarMain.loadingBar.hide();
      this.setAppMode(AppModes.SELECT);
      return;
    }

    if (response.responseType === ResponseType.progress) {
      const data = response.data as DiffusionSharedWorkerProgressData;
      // TODO wil fix this ?!?! parameter issue
      //this.renderEngine.videoLoadingCanvas.kNode.show();
      uiAccess.toolbarMain.loadingBar.update({
        message: "Rendering Frames...",
        progress: data.progress * 100,
        isShowing: true,
      });

      // console.log(response);
      // if (response.data.zipBlob) {
      //   FileUtilities.downloadBlobZip(response.data.zipBlob);
      // }
      return;
    }
  }

  private setAppMode(newAppMode: AppModes) {
    this.appMode = newAppMode;
    switch (this.appMode) {
      case AppModes.SELECT: {
        console.log("APPMODE: SELECT");
        this.selectorSquare.enable();
        this.selectionManager.enable();
        uiAccess.toolbarMain.enable();
        uiAccess.toolbarMain.changeButtonState(ToolbarMainButtonNames.SELECT, {
          active: true,
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
    uiEvents.toolbarNode.CRHOMA.onClick(() => {
      const nodes = this.selectionManager.getSelectedNodes();
      if (nodes.size > 1) {
        uiAccess.dialogError.show({
          title: "Error: Background Removal",
          message:
            "Please do not select more than 1 item for the Background Removal feature, we can only apply Background Removal to 1 item at a time",
        });
        return;
      }
      const node = nodes.values().next().value;
      try {
        if (node instanceof VideoNode) {
          const nodeChromaProps = node.getChroma();
          uiAccess.dialogChromakey.show({
            isChromakeyEnabled: nodeChromaProps.isChromakeyEnabled,
            chromakeyColor: nodeChromaProps.chromakeyColor,
          });
        } else {
          throw new Error();
        }
      } catch {
        uiAccess.dialogError.show({
          title: "Error: Background Removal",
          message: "This item is not compatible is Background Removal",
        });
      }
    });

    uiEvents.toolbarNode.SEGMENTATION.onClick(async () => {
      if (this.segmentationButtonCanBePressed == false) {
        console.log("VideoExtraction Button DEBOUNCED ");
        return;
      }
      console.log("VideoExtraction Button Clicked ACCEPTED");

      // Gating for an appropriate selection
      const nodes = this.selectionManager.getSelectedNodes();
      if (nodes.size > 1) {
        // display error that segmentation cannot be done on more than 1 at a time.
        uiAccess.dialogError.show({
          title: "Error: Video Extraction",
          message: "Video Extraction cannot be done on more than 1 item",
        });
        return;
      }
      const element = nodes.values().next().value;
      if (element instanceof VideoNode !== true) {
        uiAccess.dialogError.show({
          title: "Error: Video Extraction",
          message:
            "Extraction is only available for Videos, it is not avaliable for other Assets yet",
        });
        this.selectionManager.clearSelection();
      }
      // Gating done

      //cast medianode to videonode
      this.videoExtractionHandler.startVideoExtraction(element as VideoNode);
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
    uiEvents.toolbarMain.UNDO.onClick(() => this.undoStackManager.undo());
    uiEvents.toolbarMain.REDO.onClick(() => this.undoStackManager.redo());
    uiEvents.toolbarMain.SAVE.onClick(async (/*event*/) => {
      this.sceneManager.saveScene();
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
        await this.renderEngine.startProcessing();
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

    uiEvents.onGetStagedVideo((videoData) => {
      console.log("Engine got user video: " + videoData.mediaFileUrl);
      this.addVideo(videoData);
    });
    uiEvents.onAddTextToEngine((textdata) => {
      this.addText(textdata);
    });

    uiEvents.onChromakeyRequest((chromakeyProps) => {
      const node = this.selectionManager
        .getSelectedNodes()
        .values()
        .next().value;
      if (!node) {
        console.log("Node was not returned.");
        return;
      }
      if (node instanceof VideoNode) {
        if (chromakeyProps.isChromakeyEnabled) {
          this.commandManager.addChromaKey({
            videoNode: node,
            newChromaColor: chromakeyProps.chromakeyColor ?? {
              red: 120,
              green: 150,
              blue: 120,
            },
          });
        } else {
          this.commandManager.removeChromaKey({
            videoNode: node,
          });
        }
      }
    });
    uiEvents.aiStylize.onRequest(async (data) => {
      console.log("Engine heard AI Stylize request: ", data);

      try {
        this.setAppMode(AppModes.RENDERING);
        await this.renderEngine.startProcessing(data);
      } catch (error) {
        // throw error to retry
        uiAccess.dialogError.show({
          title: "Generation Error",
          message: error?.toString() || "Unknown Error",
        });
        this.setAppMode(AppModes.SELECT);
      }
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
    this.renderEngine.updateCaptureCanvas(undefined, undefined);
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
      fontSize: 24,
      fontFamily: "Source Sans 3",
      fill: "black",
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

  public addText(textNodeData: TextNodeData) {
    const textNode = new TextNode({
      textNodeData: textNodeData,
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      canvasPosition: this.renderEngine.captureCanvas.position(),
      canvasSize: this.renderEngine.captureCanvas.size(),
    });
    this.commandManager.createNode(textNode);
  }

  public addImage(imageFile: File) {
    const imageNode = new ImageNode({
      mediaLayerRef: this.mediaLayer,
      canvasPosition: this.renderEngine.captureCanvas.position(),
      canvasSize: this.renderEngine.captureCanvas.size(),
      imageFile: imageFile,
      selectionManagerRef: this.selectionManager,
    });

    this.commandManager.createNode(imageNode);
    this.renderEngine.addNodes(imageNode);
  }

  public addVideo(
    videNodeData: Partial<VideoNodeData> & { mediaFileUrl: string },
  ) {
    const videoNode = new VideoNode({
      mediaLayerRef: this.mediaLayer,
      selectionManagerRef: this.selectionManager,
      loadingVideosProviderRef: this.loadingVideosProvider,
      canvasPosition: this.renderEngine.captureCanvas.position(),
      canvasSize: this.renderEngine.captureCanvas.size(),
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
