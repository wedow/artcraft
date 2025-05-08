import Konva from "konva";
import { ICommand } from "./ICommand";
import { MediaNode, Transformation } from "../types";

export class TransformCommand implements ICommand {
  private nodes: Set<MediaNode>;
  private initialTransformations: Map<MediaNode, Transformation[]>;
  private finalTransformations: Map<MediaNode, Transformation[]>;
  private layerRef: Konva.Layer;

  constructor({
    nodes,
    initialTransformations,
    finalTransformations,
    layerRef,
  }: {
    nodes: Set<MediaNode>;
    initialTransformations: Map<MediaNode, Transformation[]>;
    finalTransformations: Map<MediaNode, Transformation[]>;
    layerRef: Konva.Layer;
  }) {
    this.nodes = new Set<MediaNode>(nodes);
    this.initialTransformations = initialTransformations;
    this.finalTransformations = finalTransformations;
    this.layerRef = layerRef;
    console.log("transform command", this);
  }
  private transformKNode(kNode: Konva.Node, transform: Transformation) {
    kNode.setAttrs({
      position: transform.position,
      size: transform.size,
      rotation: transform.rotation,
      scale: transform.scale,
    });
  }
  private findKNodeOfTransform = (
    node: MediaNode,
    transform: Transformation,
  ) => {
    const parentKNode = node.kNode;
    if (parentKNode._id === transform.kNodeId) {
      this.transformKNode(parentKNode, transform);
      return;
    }
    if (parentKNode instanceof Konva.Group) {
      const childKNode = parentKNode
        .getChildren()
        .find((currChild) => currChild._id === transform.kNodeId);
      if (childKNode) {
        this.transformKNode(childKNode, transform);
        return;
      }
    }
    if (import.meta.env.DEV) {
      console.warn("Error in Transform", node, transform);
    }
  };

  execute() {
    this.nodes.forEach((node) => {
      const finalTransformations = this.finalTransformations.get(node);
      if (finalTransformations) {
        finalTransformations.forEach((transform) =>
          this.findKNodeOfTransform(node, transform),
        );
      }
    });
    this.layerRef.draw();
  }

  undo() {
    this.nodes.forEach((node) => {
      const initialTransformations = this.initialTransformations.get(node);
      if (initialTransformations) {
        initialTransformations.forEach((transform) =>
          this.findKNodeOfTransform(node, transform),
        );
      }
    });
    this.layerRef.draw();
  }
}
