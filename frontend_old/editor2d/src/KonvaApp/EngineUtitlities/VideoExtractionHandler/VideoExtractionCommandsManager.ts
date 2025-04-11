import { UndoStackManager } from "~/KonvaApp/UndoRedo";
import { VideoNode } from "~/KonvaApp/Nodes";

import {
  SegmentationApi,
  Coordinates,
} from "~/Classes/ApiManager/SegmentationApi";

import { AddPointsCommand } from "./AddPointsCommand";
import { PointsStack } from "./PointsStack";

export class VideoExtractionCommandsManager {
  private undoStack: UndoStackManager;
  private selectedPointsRef: PointsStack;
  private api: SegmentationApi;
  private nodeRef: VideoNode;
  private sessionId: string;

  constructor({
    selectedPointsRef,
    api,
    nodeRef,
    sessionId,
  }: {
    selectedPointsRef: PointsStack;
    api: SegmentationApi;
    nodeRef: VideoNode;
    sessionId: string;
  }) {
    this.selectedPointsRef = selectedPointsRef;
    this.undoStack = new UndoStackManager();
    this.api = api;
    this.nodeRef = nodeRef;
    this.sessionId = sessionId;
  }
  public async addPoint(newPoint: Coordinates) {
    const command = new AddPointsCommand({
      selectedPointsRef: this.selectedPointsRef,
      nodeRef: this.nodeRef,
      newPoint: newPoint,
      api: this.api,
      sessionId: this.sessionId,
    });
    await this.undoStack.executeCommand(command);
  }
  // private removeInclusionPoint() {}
  public clear() {
    this.undoStack.clear();
  }
  public undo() {
    console.log("ve should undo");
    this.undoStack.undo();
  }
  public redo() {
    console.log("ve should redo");
    this.undoStack.redo();
  }
}
