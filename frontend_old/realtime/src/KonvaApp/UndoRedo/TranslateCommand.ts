import Konva from "konva";
import { ICommand } from "./ICommand";
import { MediaNode, Position } from "../types";

export class TranslateCommand implements ICommand {
  private nodes: Set<MediaNode>;
  private initialPositions: Map<MediaNode, Position>;
  private finalPositions: Map<MediaNode, Position>;
  private layerRef: Konva.Layer;

  constructor({
    nodes,
    initialPositions,
    finalPositions,
    layerRef,
  }: {
    nodes: Set<MediaNode>;
    initialPositions: Map<MediaNode, Position>;
    finalPositions: Map<MediaNode, Position>;
    layerRef: Konva.Layer;
  }) {
    this.nodes = new Set<MediaNode>(nodes);
    this.initialPositions = initialPositions;
    this.finalPositions = finalPositions;
    this.layerRef = layerRef;
  }
  execute() {
    this.nodes.forEach((node) => {
      const finalPosition = this.finalPositions.get(node);
      if (finalPosition) {
        node.kNode.position(finalPosition);
      }
    });
    this.layerRef.draw();
  }

  undo() {
    this.nodes.forEach((node) => {
      const initialPosition = this.initialPositions.get(node);
      if (initialPosition) {
        node.kNode.position(initialPosition);
      }
    });
    this.layerRef.draw();
  }
}
