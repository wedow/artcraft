import Konva from "konva";

import { MediaNode, Position, RGBColor, Transformation } from "../types";
import {
  
  CreateCommand,
  DeleteCommand,
  LockNodesCommand,
  MoveLayerDown,
  MoveLayerUp,
  
  TransformCommand,
  TranslateCommand,
  UndoStackManager,
  UnlockNodesCommand,
  
} from "../UndoRedo";
import {
  NodesManager,
  NodeTransformer,
  SelectionManager,
} from "../NodesManagers";
import { RealTimeDrawEngine } from "../RenderingPrimitives/RealTimeDrawEngine";

interface EngineReferences {
  mediaLayerRef: Konva.Layer;
  nodesManagerRef: NodesManager;
  nodeTransformerRef: NodeTransformer;
  selectionManagerRef: SelectionManager;
  renderEngineRef: RealTimeDrawEngine;
  undoStackManagerRef: UndoStackManager;
}

export class CommandManager {
  private mediaLayerRef: Konva.Layer;
  private nodesManagerRef: NodesManager;
  private nodeTransformerRef: NodeTransformer;
  private selectionManagerRef: SelectionManager;
  private renderEngineRef: RealTimeDrawEngine;
  private undoStackManagerRef: UndoStackManager;

  constructor(engineRefs: EngineReferences) {
    this.mediaLayerRef = engineRefs.mediaLayerRef;
    this.nodesManagerRef = engineRefs.nodesManagerRef;
    this.nodeTransformerRef = engineRefs.nodeTransformerRef;
    this.selectionManagerRef = engineRefs.selectionManagerRef;
    this.renderEngineRef = engineRefs.renderEngineRef;
    this.undoStackManagerRef = engineRefs.undoStackManagerRef;
  }

  createNode(node: MediaNode) {
    const command = new CreateCommand({
      nodes: new Set<MediaNode>([node]),
      mediaLayerRef: this.mediaLayerRef,
      nodesManagerRef: this.nodesManagerRef,
      nodeTransformerRef: this.nodeTransformerRef,
      selectionManagerRef: this.selectionManagerRef,
      renderEngineRef: this.renderEngineRef,
    });
    this.undoStackManagerRef.executeCommand(command);

    // Set the kNode's manual id to same as kNode's internal _id
    // This helps identify the kNode in the Konva layer with find
    node.kNode.id(node.kNode._id.toString());
    //this.renderEngineRef.render();
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
    //this.renderEngineRef.render();
  }

  deleteSpecificNodes(nodes: MediaNode[]) {
    const command = new DeleteCommand({
      nodes: nodes,
      mediaLayerRef: this.mediaLayerRef,
      nodesManagerRef: this.nodesManagerRef,
      nodeTransformerRef: this.nodeTransformerRef,
      selectionManagerRef: this.selectionManagerRef,
      renderEngineRef: this.renderEngineRef,
    });
    this.undoStackManagerRef.executeCommand(command);
    //this.renderEngineRef.render();
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
    //this.renderEngineRef.render();
  }
  moveNodesDown() {
    const command = new MoveLayerDown({
      nodes: this.selectionManagerRef.getSelectedNodes(),
      nodesManagerRef: this.nodesManagerRef,
      mediaLayerRef: this.mediaLayerRef,
    });
    this.undoStackManagerRef.executeCommand(command);
    //this.renderEngineRef.render();
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
    //this.renderEngineRef.render();
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
    //this.renderEngineRef.render();
  }
  
 
}
