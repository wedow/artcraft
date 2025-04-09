import { uiAccess, uiEvents } from "~/signals";
import { VideoNode } from "../../Nodes";
import {
  NodeIsolator,
  SelectionManager,
  SelectorSquare,
} from "../../NodesManagers";
import { RGBColor } from "../../types";
import { UndoStackManager } from "../../UndoRedo";
import { CommandManager } from "../CommandManager";
import {
  VideoExtractionEventDetails,
  VideoExtractionEvents,
} from "../../types/events";
import { NodeUtilities } from "../../Nodes/NodeUtilities";
import { SegmentationApi } from "~/Classes/ApiManager/SegmentationApi";
import { VideoExtractionCommandsManager } from "./VideoExtractionCommandsManager";
import { VideoExtractionMode } from "./type";
import { PointsStack } from "./PointsStack";

export class VideoExtractionHandler {
  private videoExtractionAPI = new SegmentationApi();
  private videoExtractionSession: { session_id: string } | undefined =
    undefined;
  private isProcessing: boolean = false;
  private selectedPoints: PointsStack;
  private mode: VideoExtractionMode;
  private videoExtractionCommandsManager?: VideoExtractionCommandsManager;

  //node references
  private node?: VideoNode;
  private prevIsChroma?: boolean;
  private prevChromaColor?: RGBColor;

  // engine subclass references
  private commandManagerRef: CommandManager;
  private nodeIsolatorRef: NodeIsolator;
  private selectionManagerRef: SelectionManager;
  private selectorSquareRef: SelectorSquare;
  private undoStackManagerRef: UndoStackManager;

  constructor({
    commandManagerRef,
    nodeIsolatorRef,
    selectionManagerRef,
    selectorSquareRef,
    undoStackManagerRef,
  }: {
    commandManagerRef: CommandManager;
    nodeIsolatorRef: NodeIsolator;
    selectionManagerRef: SelectionManager;
    selectorSquareRef: SelectorSquare;
    undoStackManagerRef: UndoStackManager;
  }) {
    this.commandManagerRef = commandManagerRef;
    this.nodeIsolatorRef = nodeIsolatorRef;
    this.selectionManagerRef = selectionManagerRef;
    this.selectorSquareRef = selectorSquareRef;
    this.undoStackManagerRef = undoStackManagerRef;
    this.mode = VideoExtractionMode.INCLUSION;
    this.selectedPoints = new PointsStack();
    uiAccess.toolbarVideoExtraction;
  }
  private setMode(mode: VideoExtractionMode) {
    this.mode = mode;
    uiAccess.toolbarVideoExtraction.setMode(mode);
  }
  private updateLoadingBar({
    detail,
  }: CustomEvent<VideoExtractionEventDetails>) {
    const { progress, status, message } = detail;
    const disabled = progress !== 100;
    const shouldShow = status !== VideoExtractionEvents.SESSION_CLOSED;
    uiAccess.toolbarVideoExtraction.update({
      isShowing: shouldShow,
      disabled: disabled,
      loadingBarState: {
        progress: progress,
        status: status,
        message: message,
      },
    });
  }

  public async startVideoExtraction(node: VideoNode) {
    console.log("VideoExtraction on node", node);
    if (this.node || this.prevIsChroma || this.prevChromaColor) {
      if (import.meta.env.DEV) {
        console.error("Video Extraction: Handler already has node");
      }
      return;
    }
    if (this.videoExtractionSession) {
      if (import.meta.env.DEV) {
        console.error("Video Extraction: Session already exists");
      }
      return;
    }
    this.node = node;
    this.prevIsChroma = node.isChroma;
    this.prevChromaColor = node.chromaColor;
    this.node.progressEvent.addEventListener(
      "videoextraction",
      this.updateLoadingBar as EventListener,
    );
    // when the button is pressed to enter extraction mode
    console.log("ENGEINE prepare Extraction Session.", node);
    // disable most of the UI before we get a session
    document.body.style.cursor = "wait";
    this.selectionManagerRef.disable();
    this.selectorSquareRef.disable();
    node.lock();
    this.undoStackManagerRef.setDisabled(true);
    // if the video has chroma, disable it
    if (this.prevIsChroma) {
      node.setChroma(false);
    }
    // if the video is already using extraction
    // bring the original video back
    if (node.extractionUrl === node.videoComponent.src) {
      await node.loadVideoFromUrl({
        videoUrl: node.mediaFileUrl,
        hasExistingTransform: true,
      });
    }
    node.videoComponent.pause();
    node.videoComponent.currentTime = 0;

    // actually start and wait for session
    // await node.startSegmentation();

    uiAccess.toolbarVideoExtraction.update({
      isShowing: true,
      disabled: true,
      loadingBarState: {
        progress: 25,
        status: VideoExtractionEvents.SESSION_CREATING,
        message: "Loading Video Extractor...",
      },
    });
    const blob = await NodeUtilities.urlToBlob(node.mediaFileUrl);
    uiAccess.toolbarVideoExtraction.update({
      loadingBarState: {
        progress: 75,
        status: VideoExtractionEvents.SESSION_CREATING,
        message: "Loading Video Extractor...",
      },
    });
    this.videoExtractionSession =
      await this.videoExtractionAPI.createSession(blob);
    uiAccess.toolbarVideoExtraction.update({
      loadingBarState: {
        progress: 100,
        status: VideoExtractionEvents.SESSION_CREATING,
        message: "Loading Video Extractor...",
      },
    });

    this.nodeIsolatorRef.enterIsolation(node);
    node.enableExtractionMode(this.handleExtraction.bind(this));
    this.selectionManagerRef.updateContextComponents();
    uiAccess.toolbarVideoExtraction.update({
      disabled: false,
      loadingBarState: {
        progress: 0,
        status: VideoExtractionEvents.SESSION_IDLE,
        message: "Select Points for Extraction",
      },
    });
    this.videoExtractionCommandsManager = new VideoExtractionCommandsManager({
      selectedPointsRef: this.selectedPoints,
      api: this.videoExtractionAPI,
      nodeRef: this.node,
      sessionId: this.videoExtractionSession.session_id,
    });
    document.body.style.cursor = "default";
  }

  public async endVideoExtraction() {
    // when the button is pressed to exit extraction mode
    console.log("ENGINE Attemping to close Extraction Session.");
    document.body.style.cursor = "wait";
    if (
      !this.node ||
      this.prevIsChroma === undefined ||
      !this.prevChromaColor
    ) {
      if (import.meta.env.DEV) {
        console.error("Video Extraction: node or chroma info unavailable");
      }
      return;
    }
    if (this.isProcessing) {
      console.warn(
        "Video Extraction: Cannot close while still processing frame, please wait",
      );
      return false;
    }

    this.isProcessing = true;
    uiAccess.toolbarVideoExtraction.update({
      disabled: true,
      loadingBarState: {
        progress: 100,
        status: VideoExtractionEvents.SESSION_CLOSING,
        message: "Processing Video...",
      },
    });

    const endSessionResult = await this.endSession();

    if (typeof endSessionResult === "string") {
      this.commandManagerRef.useVideoExtraction({
        videoNode: this.node,
        extractionUrl: endSessionResult,
        prevIsChroma: this.prevIsChroma,
        prevChromaColor: this.prevChromaColor,
      });
      this.unsetUi();
    } else {
      uiAccess.toolbarVideoExtraction.enable();
      console.log("Busy Processing Video.");
    }
    document.body.style.cursor = "default";
  }

  private async endSession(): Promise<boolean | string> {
    if (!this.videoExtractionSession || !this.node) {
      if (import.meta.env.DEV) {
        console.error("Video Extraction: Session does not exist");
      }
      return false;
    }
    try {
      console.log("Requesting a close");
      const response = await this.videoExtractionAPI.addPointsToSession(
        this.videoExtractionSession.session_id,
        24,
        [
          {
            timestamp: 0,
            objects: [
              {
                style: {
                  color: [0, 0, 1],
                },
                object_id: 0,
                points: this.selectedPoints.get(),
              },
            ],
          },
        ],
        true, // propagation
        // propagation = true = this requests the entire video to be processed
      );
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 50,
          status: VideoExtractionEvents.SESSION_CLOSING,
          message: "Processing Video...",
        },
      });
      // replace the video component and reregister all the other elements.
      console.log(
        "Extracted Video URL",
        response["masked_video_cdn_url"],
        response,
      );
      // TODO: we assume the URL to be checked will eventually return true
      const extractionUrl = response["masked_video_cdn_url"];
      await NodeUtilities.isAssetUrlAvailable({
        url: extractionUrl,
        sleepDurationMs: 2000,
      });
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 75,
          status: VideoExtractionEvents.SESSION_CLOSING,
          message: "Processing Video...",
        },
      });
      this.node.extractionUrl = extractionUrl;
      // set chroma automatically.
      this.node.isChroma = true;
      await this.node.loadVideoFromUrl({
        videoUrl: extractionUrl,
        hasExistingTransform: true,
      });
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 100,
          status: VideoExtractionEvents.SESSION_CLOSING,
          message: "Done Processing Video",
        },
      });
      this.isProcessing = false;

      return extractionUrl;
    } catch (error) {
      console.error(error);
      this.isProcessing = false;
      return false;
    }
  }

  public async cancelVideoExtraction() {
    // when the button is pressed to exit extraction mode
    console.log("ENGINE cancel Extraction Session.");

    if (!this.node) {
      // this case should not happen, without a node nothing could be done
      if (import.meta.env.DEV) {
        console.error("Video Extraction: node or chroma info unavailable");
      }
      return;
    }
    if (this.prevIsChroma === undefined || !this.prevChromaColor) {
      // this case should not happen, but could proceed
      if (import.meta.env.DEV) {
        console.error("Video Extraction: chroma info unavailable");
      }
    }

    await this.node.loadVideoFromUrl({
      videoUrl: this.node.mediaFileUrl,
      hasExistingTransform: true,
    });
    this.unsetUi();
    this.isProcessing = false;
    document.body.style.cursor = "default";
  }
  private async handleExtraction() {
    console.log("Handle Extraction");
    if (!this.node) {
      console.log("Video Extraction does not have VideoNode");
      return;
    }
    if (!this.videoExtractionSession) {
      console.log("Video Extraction Session Not Ready");
      return;
    }
    if (this.isProcessing) {
      console.log("Still Processing");
      return;
    }

    this.isProcessing = true;
    document.body.style.cursor = "wait";

    // Get the local coordinates of the click relative to the rectangle
    const kNode = this.node.kNode;
    const localPos = kNode.getRelativePointerPosition();
    const fileSize = this.node.mediaFileSize;
    console.log("Local coordinates:mediaFileSize", localPos);
    console.log("mediaFileSize:", this.node.mediaFileSize);
    if (!localPos || !fileSize) {
      // TODO: error handling
      return;
    }
    const adjustedLocalPos = {
      x: (localPos.x / kNode.width()) * kNode.scaleX() * fileSize.width,
      y: (localPos.y / kNode.height()) * kNode.scaleY() * fileSize.height,
    };

    if (this.videoExtractionCommandsManager) {
      await this.videoExtractionCommandsManager.addPoint({
        coordinates: [adjustedLocalPos.x, adjustedLocalPos.y],
        include: this.mode === "inclusion",
      });
    }

    document.body.style.cursor = "default";
    this.isProcessing = false;
  }
  public undo() {
    this.videoExtractionCommandsManager?.undo();
  }
  public redo() {
    this.videoExtractionCommandsManager?.redo();
  }

  private unsetUi() {
    // unlock the ui
    this.nodeIsolatorRef.exitIsolation();
    this.undoStackManagerRef.setDisabled(false);
    this.selectorSquareRef.enable();
    if (this.node) {
      this.node.disableExtractionMode();
      this.node.progressEvent.removeEventListener(
        "videoextraction",
        this.updateLoadingBar as EventListener,
      );
      this.node.unlock();
    }
    this.selectionManagerRef.updateContextComponents();
    this.selectionManagerRef.enable();
    uiAccess.toolbarVideoExtraction.update({
      isShowing: false,
      disabled: false,
    });

    // reset to close off the session.
    this.videoExtractionCommandsManager?.clear();
    this.selectedPoints.clear();
    this.node = undefined;
    this.prevIsChroma = undefined;
    this.prevChromaColor = undefined;
    this.videoExtractionSession = undefined;
  }
  public listenToToolbarEvents() {
    uiEvents.toolbarVideoExtraction.INCLUSION_MODE.onClick(() => {
      this.setMode(VideoExtractionMode.INCLUSION);
    });
    uiEvents.toolbarVideoExtraction.EXCLUSION_MODE.onClick(() => {
      this.setMode(VideoExtractionMode.EXCLUSION);
    });
    uiEvents.toolbarVideoExtraction.UNDO.onClick(() => {
      this.undo();
    });
    uiEvents.toolbarVideoExtraction.REDO.onClick(() => {
      this.redo();
    });
    uiEvents.toolbarVideoExtraction.DONE.onClick(() => {
      this.endVideoExtraction();
    });
    uiEvents.toolbarVideoExtraction.CANCEL.onClick(() => {
      this.cancelVideoExtraction();
    });
  }
}
