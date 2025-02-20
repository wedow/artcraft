import Konva from "konva";
import { ImageNode, ShapeNode, TextNode, VideoNode } from "../Nodes";
import { MediaNode, Position, RGBColor, Transformation } from "../types";
import {
  AddChromaKey,
  CreateCommand,
  DeleteCommand,
  LockNodesCommand,
  MoveLayerDown,
  MoveLayerUp,
  RemoveChromaKey,
  TransformCommand,
  TranslateCommand,
  UndoStackManager,
  UnlockNodesCommand,
  UseVideoExtraction,
} from "../UndoRedo";
import {
  NodesManager,
  NodeTransformer,
  SelectionManager,
} from "../NodesManagers";
import { RenderEngine } from "../RenderingPrimitives/RenderEngine";

interface EngineReferences {
  mediaLayerRef: Konva.Layer;
  nodesManagerRef: NodesManager;
  nodeTransformerRef: NodeTransformer;
  selectionManagerRef: SelectionManager;
  renderEngineRef: RenderEngine;
  undoStackManagerRef: UndoStackManager;
}

export class CommandManager {
  private mediaLayerRef: Konva.Layer;
  private nodesManagerRef: NodesManager;
  private nodeTransformerRef: NodeTransformer;
  private selectionManagerRef: SelectionManager;
  private renderEngineRef: RenderEngine;
  private undoStackManagerRef: UndoStackManager;

  constructor(engineRefs: EngineReferences) {
    this.mediaLayerRef = engineRefs.mediaLayerRef;
    this.nodesManagerRef = engineRefs.nodesManagerRef;
    this.nodeTransformerRef = engineRefs.nodeTransformerRef;
    this.selectionManagerRef = engineRefs.selectionManagerRef;
    this.renderEngineRef = engineRefs.renderEngineRef;
    this.undoStackManagerRef = engineRefs.undoStackManagerRef;
  }

  createNode(node: VideoNode | ImageNode | TextNode | ShapeNode) {
    const command = new CreateCommand({
      nodes: new Set<MediaNode>([node]),
      mediaLayerRef: this.mediaLayerRef,
      nodesManagerRef: this.nodesManagerRef,
      nodeTransformerRef: this.nodeTransformerRef,
      selectionManagerRef: this.selectionManagerRef,
      renderEngineRef: this.renderEngineRef,
    });
    this.undoStackManagerRef.executeCommand(command);
  }
  deleteNodes() {
    const nodes = this.selectionManagerRef.getSelectedNodes();
    const command = new DeleteCommand({
      nodes: nodes,
      mediaLayerRef: this.mediaLayerRef,
      nodesManagerRef: this.nodesManagerRef,
      nodeTransformerRef: this.nodeTransformerRef,
      selectionManagerRef: this.selectionManagerRef,
      renderEngineRef: this.renderEngineRef,
    });
    this.undoStackManagerRef.executeCommand(command);
  }
  toggleLockNodes() {
    const nodes = this.selectionManagerRef.getSelectedNodes();
    const node = nodes.values().next().value;
    if (!node) {
      console.log("Node Not Found for Locking");
      return;
    }
    if (node.isLocked()) {
      const command = new UnlockNodesCommand({
        nodes: this.selectionManagerRef.getSelectedNodes(),
      });
      this.undoStackManagerRef.executeCommand(command);
    } else {
      const command = new LockNodesCommand({
        nodes: this.selectionManagerRef.getSelectedNodes(),
      });
      this.undoStackManagerRef.executeCommand(command);
    }
  }
  moveNodesUp() {
    const command = new MoveLayerUp({
      nodes: this.selectionManagerRef.getSelectedNodes(),
      nodesManagerRef: this.nodesManagerRef,
      mediaLayerRef: this.mediaLayerRef,
    });
    this.undoStackManagerRef.executeCommand(command);
  }
  moveNodesDown() {
    const command = new MoveLayerDown({
      nodes: this.selectionManagerRef.getSelectedNodes(),
      nodesManagerRef: this.nodesManagerRef,
      mediaLayerRef: this.mediaLayerRef,
    });
    this.undoStackManagerRef.executeCommand(command);
  }
  translateNodes(props: {
    nodes: Set<MediaNode>;
    initialPositions: Map<MediaNode, Position>;
    finalPositions: Map<MediaNode, Position>;
  }) {
    const command = new TranslateCommand({
      ...props,
      layerRef: this.mediaLayerRef,
    });
    this.undoStackManagerRef.pushCommand(command);
  }
  transformNodes(props: {
    nodes: Set<MediaNode>;
    initialTransformations: Map<MediaNode, Transformation[]>;
    finalTransformations: Map<MediaNode, Transformation[]>;
  }) {
    const command = new TransformCommand({
      ...props,
      layerRef: this.mediaLayerRef,
    });
    this.undoStackManagerRef.pushCommand(command);
  }
  addChromaKey(props: { videoNode: VideoNode; newChromaColor: RGBColor }) {
    const command = new AddChromaKey(props);
    this.undoStackManagerRef.executeCommand(command);
  }
  removeChromaKey(props: { videoNode: VideoNode }) {
    const command = new RemoveChromaKey(props);
    this.undoStackManagerRef.executeCommand(command);
  }
  useVideoExtraction(props: {
    videoNode: VideoNode;
    extractionUrl: string;
    prevIsChroma: boolean;
    prevChromaColor: RGBColor;
  }) {
    const command = new UseVideoExtraction(props);
    this.undoStackManagerRef.pushCommand(command);
  }
}
