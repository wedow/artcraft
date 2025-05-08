import Konva from "konva";
import { SelectionManager } from "../NodesManagers";
import { Position, Size, NodeData, TransformationData } from "../types";
import { NodeType } from "./constants";
import { NodeUtilities } from "./NodeUtilities";
import { NetworkedNode } from "./NetworkedNode";

export enum ShapeType {
  CIRCLE = "circle",
  SQUARE = "square",
  TRIANGLE = "triangle",
}

interface ShapeNodeConstructor {
  canvasPosition: Position;
  canvasSize: Size;
  shapeType: ShapeType;
  size: Size;
  color?: string; // Hex color string
  transform?: TransformationData;
  mediaLayerRef: Konva.Layer;
  selectionManagerRef: SelectionManager;
  loaded: () => Promise<void>;
}

export class ShapeNode extends NetworkedNode {
  retry(): void {
    throw new Error("Method not implemented.");
  }

  public shapeType: ShapeType;
  public size: Size;
  public color: string;

  constructor({
    canvasPosition,
    canvasSize,
    shapeType,
    size,
    color = "#2D81FF", // Default red if no color provided
    transform: existingTransform,
    mediaLayerRef,
    selectionManagerRef,
    loaded,
  }: ShapeNodeConstructor) {
    // Create the actual shape inside the group
    const transform = NodeUtilities.getInitialTransform({
      existingTransform,
      mediaFileSize: size,
      canvasPosition,
      canvasSize,
    });

    let shape = null;

    switch (shapeType) {
      case ShapeType.CIRCLE:
        shape = new Konva.Ellipse({
          radiusX: size.width / 2,
          radiusY: size.height / 2,
          fill: color,
          strokeScaleEnabled: false,
          draggable: true,
        });
        break;

      case ShapeType.SQUARE:
        shape = new Konva.Rect({
          width: size.width,
          height: size.height,
          ...transform,
          fill: color,
          strokeScaleEnabled: false,
          draggable: true,
        });
        break;

      case ShapeType.TRIANGLE:
        shape = new Konva.Shape({
          width: size.width,
          height: size.height,
          ...transform,
          fill: color,
          strokeScaleEnabled: false,
          draggable: true,
          sceneFunc: (context, shape) => {
            context.beginPath();
            context.moveTo(shape.width() / 2, 0);
            context.lineTo(shape.width(), shape.height());
            context.lineTo(0, shape.height());
            context.closePath();
            context.fillStrokeShape(shape);
          }
        });
        break;

      default:
        throw new Error("Invalid shape type");
    }

    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: shape,
    });

    this.shapeType = shapeType;
    this.size = size;
    this.color = color;

    // Center the shape
    const centerPosition = NodeUtilities.positionNodeOnCanvasCenter({
      canvasOffset: canvasPosition,
      componentSize: this.size,
      maxSize: canvasSize,
    });

    // If the shape is an ellipse, the center is the origin so we need to offset it
    if (shapeType === ShapeType.CIRCLE) {
      centerPosition.x += size.width / 2;
      centerPosition.y += size.height / 2;
    }

    // Add shape to group
    // bring to the front
    this.kNode.moveToTop();
    this.kNode.setPosition(centerPosition);
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
