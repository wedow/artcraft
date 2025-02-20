import Konva from "konva";
import { SelectionManager } from "../NodesManagers";
import { Position, Size, NodeData, TransformationData } from "../types";
import { BaseNode } from "./BaseNode";
import { NodeType } from "./constants";
import { NodeUtilities } from "./NodeUtilities";

export enum ShapeType {
  CIRCLE = "circle",
  SQUARE = "square",
  TRIANGLE = "triangle",
}

interface ShapeNodeConstructor {
  canvasPosition: Position;
  canvasSize: Size;
  shapeType: ShapeType;
  size: number;
  color?: string; // Hex color string
  transform?: TransformationData;
  mediaLayerRef: Konva.Layer;
  selectionManagerRef: SelectionManager;
}

export class ShapeNode extends BaseNode {
  public kNode: Konva.Group;

  constructor({
    canvasPosition,
    canvasSize,
    shapeType,
    size,
    color = "#ff0000", // Default red if no color provided
    transform: existingTransform,
    mediaLayerRef,
    selectionManagerRef,
  }: ShapeNodeConstructor) {
    // Create the actual shape inside the group
    const transform = NodeUtilities.getInitialTransform({
      existingTransform,
      canvasPosition,
      canvasSize,
    });
    let shape = null;
    switch (shapeType) {
      case ShapeType.CIRCLE:
        const circleShape = new Konva.Circle({
          radius: 50,
          ...transform,
          fill: color,
          strokeScaleEnabled: false,
          draggable: true,
        });

        // Convert circle to image
        const dataURL = circleShape.toDataURL();
        const imageObj = new Image();
        imageObj.src = dataURL;

        shape = new Konva.Image({
          image: imageObj,
          x: circleShape.x(),
          y: circleShape.y(),
          width: circleShape.width(),
          height: circleShape.height(),
          ...transform,
          fill: 'transparent',
          strokeScaleEnabled: false,
          draggable: true,
        });

        imageObj.onload = () => {
          this.mediaLayerRef.draw();
        };

        // Clean up the temporary circle
        circleShape.destroy();
        break;

      case ShapeType.SQUARE:
        const squareShape = new Konva.Rect({
          width: 100,
          height: 100,
          ...transform,
          fill: color,
          strokeScaleEnabled: false,
          draggable: true,
        });

        // Convert square to image
        const squareDataURL = squareShape.toDataURL();
        const squareImageObj = new Image();
        squareImageObj.src = squareDataURL;

        shape = new Konva.Image({
          image: squareImageObj,
          x: squareShape.x(),
          y: squareShape.y(),
          width: squareShape.width(),
          height: squareShape.height(),
          ...transform,
          fill: 'transparent',
          strokeScaleEnabled: false,
          draggable: true,
        });

        squareImageObj.onload = () => {
          this.mediaLayerRef.draw();
        };

        // Clean up the temporary square
        squareShape.destroy();
        break;

      case ShapeType.TRIANGLE:
        const triangleShape = new Konva.RegularPolygon({
          sides: 3,
          radius: 50,
          ...transform,
          fill: color,
          strokeScaleEnabled: false,
          draggable: true,
        });

        // Convert triangle to image
        const triangleDataURL = triangleShape.toDataURL();
        const triangleImageObj = new Image();
        triangleImageObj.src = triangleDataURL;

        shape = new Konva.Image({
          image: triangleImageObj,
          x: triangleShape.x(),
          y: triangleShape.y(),
          width: triangleShape.width(),
          height: triangleShape.height(),
          ...transform,
          fill: 'transparent',
          strokeScaleEnabled: false,
          draggable: true,
        });

        triangleImageObj.onload = () => {
          this.mediaLayerRef.draw();
        };

        // Clean up the temporary triangle
        triangleShape.destroy();
        break;

      default:
        throw new Error("Invalid shape type");
    }

    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: shape,
    });

    this.kNode = shape;
    this.shapeType = shapeType;

    // Add shape to group
    const centerPosition = NodeUtilities.positionNodeOnCanvasCenter({
      canvasOffset: canvasPosition,
      componentSize: canvasSize,
      maxSize: canvasSize,
    });
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
