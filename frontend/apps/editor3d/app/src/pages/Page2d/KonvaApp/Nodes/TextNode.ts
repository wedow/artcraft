import Konva from "konva";
import { SelectionManager } from "../NodesManagers";
import { BaseNode } from "./BaseNode";
import {
  NodeData,
  Position,
  Size,
  TextAlign,
  TextNodeData,
  TransformationData,
} from "../types";
import { NodeUtilities } from "./NodeUtilities";
import { NodeType, transparent } from "./constants";

export class TextNode extends BaseNode {
  public kNode: Konva.Image;
  private textNodeData: TextNodeData;
  private originalTextSize?: Size;
  public didFinishLoading: boolean = true;

  constructor({
    textNodeData,
    selectionManagerRef,
    mediaLayerRef,
    canvasPosition,
    canvasSize,
    transform: existingTransform,
  }: {
    textNodeData: TextNodeData;
    selectionManagerRef: SelectionManager;
    mediaLayerRef: Konva.Layer;
    canvasSize: Size;
    canvasPosition: Position;
    transform?: TransformationData;
  }) {
    const transform = NodeUtilities.getInitialTransform({
      existingTransform,
      canvasPosition,
      canvasSize,
    });
    // Create a new ImageNode to house the canvas text
    const kNode = new Konva.Image({
      image: undefined, // will use the canvas as the image source
      ...transform,
      draggable: true,
      strokeScaleEnabled: false,
    });

    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: kNode,
    });
    this.textNodeData = textNodeData;
    this.kNode = kNode;
    this.mediaLayerRef.add(this.kNode);
    this.listenToBaseKNode();

    this.loadTextImageUsingCanvas({
      maxSize: canvasSize,
      refPosition: canvasPosition,
      existingTransform: existingTransform,
    });
  }

  private loadTextImageUsingCanvas({
    maxSize,
    refPosition,
    existingTransform,
  }: {
    maxSize: Size;
    refPosition: Position;
    existingTransform?: TransformationData;
  }) {
    // Create a temporary canvas to draw the text
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }

    // calvulate and set canvas
    const lines: string[] = this.textNodeData.text.split("\n");
    const { fontSize, fontFamily, fontStyle, fontWeight, maxWidth, textAlign } =
      this.textNodeData;
    this.originalTextSize = {
      width: maxWidth,
      height: fontSize * lines.length * 1.5 + fontSize * 0.5,
    };
    canvas.width = this.originalTextSize.width;
    canvas.height = this.originalTextSize.height;

    // Set the font styles to match the text node
    context.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;

    context.fillStyle = this.textNodeData.color;
    context.textAlign = textAlign;
    context.textBaseline = "top";

    // Draw the text on the canvas
    lines.forEach((line, idx) => {
      const yOffset = fontSize * (1.5 * idx + 0.5);
      const xOffset =
        textAlign === TextAlign.LEFT
          ? 0
          : textAlign === TextAlign.CENTER
            ? maxWidth / 2
            : maxWidth; // textAlign === TextAlign.Right

      context.fillText(line, xOffset, yOffset);
    });

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL("image/png");

    // Create a new Image object
    const imageComponent = new Image();
    imageComponent.crossOrigin = "anonymous";
    imageComponent.onload = () => {
      if (existingTransform) {
        this.kNode.setAttrs({
          image: imageComponent,
          fill: transparent,
        });
        return;
      }
      const imageSize = {
        width: canvas.width,
        height: canvas.height,
      };

      const centerPosition = NodeUtilities.positionNodeOnCanvasCenter({
        canvasOffset: refPosition,
        componentSize: imageSize,
        maxSize: maxSize,
      });

      this.kNode.setAttrs({
        image: imageComponent,
        size: imageSize,
        position: centerPosition,
        fill: transparent,
      });
    };
    imageComponent.src = dataURL;
  }

  public getNodeData(canvasPostion: Position) {
    const data: NodeData = {
      type: NodeType.TEXT,
      transform: {
        position: {
          x: this.kNode.position().x - canvasPostion.x,
          y: this.kNode.position().y - canvasPostion.y,
        },
        size: this.kNode.size(),
        rotation: this.kNode.rotation(),
        scale: {
          x: this.kNode.scaleX(),
          y: this.kNode.scaleY(),
        },
        zIndex: this.kNode.getZIndex(),
      },
      textNodeData: this.textNodeData,
    };
    return data;
  }
}
