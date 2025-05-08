import Konva from "konva";
import { SelectionManager } from "../NodesManagers";
import { Position, Size, NodeData, TransformationData } from "../types";
import { NodeType } from "./constants";
import { NodeUtilities } from "./NodeUtilities";
import { NetworkedNode } from "./NetworkedNode";

interface PreviewCopyConstructor {
  image: Konva.Image;
  mediaLayerRef: Konva.Layer;
  selectionManagerRef: SelectionManager;
  loaded: () => Promise<void>;
}

export class PreviewCopyNode extends NetworkedNode {
  retry(): void {
    throw new Error("Method not implemented.");
  }

  constructor({
    image,
    mediaLayerRef,
    selectionManagerRef,
    loaded,
  }: PreviewCopyConstructor) {
    // Create the actual shape inside the group

    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: image,
    });
    this.kNode.moveToTop();
    this.mediaLayerRef.add(this.kNode);
    this.listenToBaseKNode();
    this.mediaLayerRef.draw();
  }

  public getNodeData(canvasPosition: Position) {
    const data: NodeData = {
      type: NodeType.SHAPE,
      transform: {
        position: {
          x: this.kNode.position().x - canvasPosition.x,
          y: this.kNode.position().y - canvasPosition.y,
        },
        size: this.kNode.size(),
        rotation: this.kNode.rotation(),
        scale: {
          x: this.kNode.scaleX(),
          y: this.kNode.scaleY(),
        },
        zIndex: this.kNode.getZIndex(),
      },
    };
    return data;
  }
}
