import Konva from "konva";
import { SelectionManager } from "../NodesManagers";
import { Position, NodeData } from "../types";
import { NodeType } from "./constants";

import { NetworkedNode } from "./NetworkedNode";

interface PaintNodeConstructor {
  canvasElement:HTMLCanvasElement;
  lineBounds: {
    width: number;
    height: number;
    x: number;
    y: number;
    };
  mediaLayerRef: Konva.Layer;
  selectionManagerRef: SelectionManager;
  
  loaded: () => Promise<void>;
}

export class PaintNode extends NetworkedNode {
  retry(): void {
    throw new Error("Method not implemented.");
  }

  constructor({
    canvasElement,
    lineBounds,
    mediaLayerRef,
    selectionManagerRef,
    loaded,
  }: PaintNodeConstructor) {

    const cl = canvasElement

    // Convert circle to image
    const dataURL = cl.toDataURL();
    const imageObj = new Image();
    imageObj.src = dataURL;

    const paintShape = new Konva.Image({
        x: lineBounds.x,
        y: lineBounds.y,
        width: lineBounds.width,
        height: lineBounds.height,
        image: imageObj,
        listening: false, // Disable event listening to allow captureCanvas to receive events
        draggable: true,
        // stroke: '#000000',
        // strokeWidth: 2,
        // dash: [5, 5], // Creates dotted outline THIS IS FOR DEBUG
        globalCompositeOperation: 'source-over',
        fill: 'transparent' 
      });

    imageObj.onload = () => {
        this.mediaLayerRef.draw();
        loaded();
    };
  
    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: paintShape,
    });

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
