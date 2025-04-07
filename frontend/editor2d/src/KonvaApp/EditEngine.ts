import Konva from "konva";

import { uiAccess } from "~/signals";
import { CommandManager, MatteBox } from "./EngineUtitlities";
import { ImageNode } from "./Nodes";
import { PaintNode } from "./Nodes/PaintNode";
import {
  NodesManager,
  NodesTranslationEventDetails,
  NodeTransformationEventDetails,
  NodeTransformer,
  SelectionManager,
  SelectionManagerEvents,
  SelectorSquare,
} from "./NodesManagers";
import { UndoStackManager } from "./UndoRedo";

import { ToolbarMainButtonNames } from "~/components/features/ToolbarMain/enum";
import { EditModes, VideoResolutions } from "./constants";

import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode/enums";

import { RealTimeDrawEngine } from "./RenderingPrimitives/RealTimeDrawEngine";

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

export class EditEngine {
  private editMode: EditModes = EditModes.SELECT;
  private boardCanvasRef: HTMLDivElement;
  private stage: Konva.Stage;
  private bgLayer: Konva.Layer;
  private mediaLayer: Konva.Layer;
  private nodeIsolationLayer: Konva.Layer;
  private uiLayer: Konva.Layer;
  private offScreenCanvas: OffscreenCanvas;
  private realTimeDrawEngine: RealTimeDrawEngine;
  private nodesManager: NodesManager;
  private nodeTransformer: NodeTransformer;
  private selectionManager: SelectionManager;
  private selectorSquare: SelectorSquare;
  private matteBox: MatteBox;

  private undoStackManager: UndoStackManager;
  private commandManager: CommandManager;

  public segmentationButtonCanBePressed: boolean = true;
  // signal reference
  constructor(boardCanvasRef: HTMLDivElement) {
    if (import.meta.env.DEV) {
      console.log("Engine Created");
    }
    this.editMode = EditModes.SELECT;

    this.boardCanvasRef = boardCanvasRef;
    this.stage = new Konva.Stage({
      container: this.boardCanvasRef,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    //this.bgLayer = new Konva.Layer();

    this.mediaLayer = new Konva.Layer();

    this.nodeIsolationLayer = new Konva.Layer();
    this.uiLayer = new Konva.Layer();

    //this.stage.add(this.bgLayer);
    this.stage.add(this.mediaLayer);
    this.stage.add(this.nodeIsolationLayer);
    this.stage.add(this.uiLayer);

    // Konva Transformer
    this.nodeTransformer = new NodeTransformer();
    this.uiLayer.add(this.nodeTransformer.getKonvaNode());

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
    this.setEditMode(this.editMode);
  }

  private setEditMode(newEditMode: EditModes) {
    this.editMode = newEditMode;
    switch (this.editMode) {
      case EditModes.SELECT:
      default: {
        console.log("EDITMODE: SELECT");
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
      case EditModes.EDIT: {
        console.log("EDITMODE: EDIT");
        this.realTimeDrawEngine.enablePaintMode();
        this.selectorSquare.disable();
        this.selectionManager.disable();
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

    // Listen to Toolbar Main
    // uiEvents.toolbarMain.UNDO.onClick(() => {
    //   this.undoStackManager.undo();
    // });
    // uiEvents.toolbarMain.REDO.onClick(() => {
    //   this.undoStackManager.redo();
    //   this.realTimeDrawEngine.render();
    // });

    // uiEvents.toolbarMain.SAVE.onClick(async (/*event*/) => {
    //   await this.realTimeDrawEngine.saveOutput();
    // });

    // uiEvents.toolbarMain.SELECT.onClick(() => {
    //   console.log("Toolbar Main >> Select");
    //   this.setAppMode(AppModes.SELECT);
    // });

    // uiEvents.toolbarMain.PAINT.onClick(() => {
    //   console.log("Toolbar Main >> Paint");
    //   this.setAppMode(AppModes.PAINT);
    // });
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

  public initializeStage() {
    // load canvas that was originaly saved TODO Save manager for resharing.
    uiAccess.toolbarNode.hide();
    uiAccess.loadingBar.hide();
    this.setupStage();
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

  public addImage(imageFile: File) {
    const imageNode = new ImageNode({
      mediaLayerRef: this.mediaLayer,
      canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
      canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
      imageFile: imageFile,
      selectionManagerRef: this.selectionManager,
      loaded: async () => {
        await this.realTimeDrawEngine.render();
        this.setEditMode(EditModes.SELECT);
      },
    });

    this.commandManager.createNode(imageNode);
  }

  public addImageFromImageBitmap(imageBitmap: ImageBitmap) {
    const imageNode = new ImageNode({
      mediaLayerRef: this.mediaLayer,
      canvasPosition: this.realTimeDrawEngine.captureCanvas.position(),
      canvasSize: this.realTimeDrawEngine.captureCanvas.size(),
      imageBitmap: imageBitmap,
      selectionManagerRef: this.selectionManager,
      loaded: async () => {
        await this.realTimeDrawEngine.render();
        this.setEditMode(EditModes.SELECT);
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
}
