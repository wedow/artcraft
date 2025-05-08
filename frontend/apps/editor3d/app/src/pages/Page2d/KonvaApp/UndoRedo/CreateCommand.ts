import Konva from "konva";
import { ICommand } from "./ICommand";
import { MediaNode } from "../types";
import {
  NodesManager,
  NodeTransformer,
  SelectionManager,
} from "../NodesManagers";
import { RealTimeDrawEngine } from "../RenderingPrimitives/RealTimeDrawEngine";
import { toolbarNode } from "../../signals/uiAccess/toolbarNode";

export class CreateCommand implements ICommand {
  private mediaLayerRef: Konva.Layer;
  private nodes: Set<MediaNode>;
  private zIndices: Map<MediaNode, number>;

  private nodesManagerRef: NodesManager;
  private nodeTransformerRef: NodeTransformer;
  private selectionManagerRef: SelectionManager;

  private renderEngineRef: RealTimeDrawEngine;

  constructor({
    nodes,
    mediaLayerRef,
    nodesManagerRef,
    nodeTransformerRef,
    renderEngineRef,
    selectionManagerRef,
  }: {
    nodes: Set<MediaNode>;
    mediaLayerRef: Konva.Layer;
    nodesManagerRef: NodesManager;
    nodeTransformerRef: NodeTransformer;
    renderEngineRef: RealTimeDrawEngine;
    selectionManagerRef: SelectionManager;
  }) {
    this.nodes = nodes;
    this.zIndices = new Map(nodesManagerRef.getAllZIndices());

    this.mediaLayerRef = mediaLayerRef;
    this.nodesManagerRef = nodesManagerRef;
    this.nodeTransformerRef = nodeTransformerRef;
    this.renderEngineRef = renderEngineRef;
    this.selectionManagerRef = selectionManagerRef;
  }

  execute() {
    this.nodes.forEach((node) => {
      this.mediaLayerRef.add(node.kNode);
      this.nodesManagerRef.saveNode(node);
      this.renderEngineRef.addNodes(node);
    });
    this.mediaLayerRef.draw();

  }

  undo() {
    this.nodes.forEach((node) => {
      this.nodesManagerRef.removeNode(node);
      this.renderEngineRef.removeNodes(node);
      this.selectionManagerRef.deselectNode(node);
      node.kNode.remove();
      if (
        this.zIndices.get(node) &&
        node.kNode.getZIndex() !== this.zIndices.get(node)
      ) {
        node.kNode.setZIndex(this.zIndices.get(node));
      }
    });
    this.nodeTransformerRef.clear();
    toolbarNode.hide();
    this.mediaLayerRef.draw();
    this.renderEngineRef.render();
 
  }
}
