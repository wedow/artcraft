import Konva from "konva";
import { SelectionManager } from "../NodesManagers";
import { BaseNode } from "./BaseNode";
import {
  NodeData,
  Position,
  Size,
  TextNodeChildrenTransformData,
  TextNodeData,
  TransformationData,
} from "../types";
import { NodeUtilities } from "./NodeUtilities";
import { NodeType } from "./constants";

export class PureTextNode extends BaseNode {
  public kNode: Konva.Group;
  public rectNode: Konva.Rect;
  public textNode: Konva.Text;
  private originalTextSize: Size;
  private textNodeData: TextNodeData;

  public didFinishLoading: boolean = true;

  constructor({
    textNodeData,
    selectionManagerRef,
    mediaLayerRef,
    canvasPosition,
    canvasSize,
    transform: existingTransform,
    textChildrenTransforms,
  }: {
    textNodeData: TextNodeData;
    selectionManagerRef: SelectionManager;
    mediaLayerRef: Konva.Layer;
    canvasSize: Size;
    canvasPosition: Position;
    transform?: TransformationData;
    textChildrenTransforms?: TextNodeChildrenTransformData;
  }) {
    const textNode = new Konva.Text({
      ...textNodeData,
      x: 10,
      y: 10,
      width: 500,
    });
    const kNode = new Konva.Group({
      position: NodeUtilities.positionNodeOnCanvasCenter({
        canvasOffset: canvasPosition,
        componentSize: {
          width: textNode.width() + 20,
          height: textNode.height() + 20,
        },
        maxSize: canvasSize,
      }),
      width: textNode.width() + 20,
      height: textNode.height() + 20,
      draggable: true,
    });
    const rectNode = new Konva.Rect({
      x: 0,
      y: 0,
      width: textNode.width() + 20,
      height: textNode.height() + 20,
      strokeScaleEnabled: false,
      name: "wrapper",
    });

    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: kNode,
    });
    this.textNodeData = textNodeData;
    this.kNode = kNode;
    this.textNode = textNode;
    this.rectNode = rectNode;
    this.kNode.add(this.rectNode);
    this.kNode.add(this.textNode);
    if (existingTransform && textChildrenTransforms) {
      this.applyTransform({
        existingTransform,
        textChildrenTransforms,
        canvasPosition,
      });
    }
    this.mediaLayerRef.add(this.kNode);
    this.originalTextSize = this.textNode.size();
    this.listenToBaseKNode();
  }
  public listenToBaseKNodeTransformations() {
    this.kNode.on("transformstart", () => {
      // console.log("transformstart", event.target._id);
      this.selectionManagerRef.transformStart();
    });

    this.kNode.on("transform", () => {
      const newBoxSize = {
        width: this.kNode.width() * this.kNode.scaleX(),
        height: this.kNode.height() * this.kNode.scaleY(),
        scaleX: 1,
        scaleY: 1,
      };
      this.rectNode.setAttrs(newBoxSize);
      this.kNode.setAttrs(newBoxSize);
      const scaleX = (newBoxSize.width - 20) / this.originalTextSize.width;
      const scaleY = (newBoxSize.height - 20) / this.originalTextSize.height;
      this.textNode.setAttrs({
        // make sure these stay the same
        x: 10,
        y: 10,
        size: this.originalTextSize,
        //while these changes in size
        scaleX: scaleX,
        scaleY: scaleY,
      });
    });
    this.kNode.on("transformend", () => {
      // console.log("transformend", event.target._id);
      NodeUtilities.printKNodeAttrs(this.kNode);
      NodeUtilities.printKNodeAttrs(this.textNode);
      this.selectionManagerRef.transformEnd(this);
    });
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
      textChildrenTransforms: {
        wrapperRectTransform: {
          position: this.rectNode.position(),
          size: this.rectNode.size(),
          rotation: this.rectNode.rotation(),
          scale: {
            x: this.rectNode.scaleX(),
            y: this.rectNode.scaleY(),
          },
          zIndex: this.rectNode.getZIndex(),
        },
        textNodeTransform: {
          position: this.textNode.position(),
          size: this.textNode.size(),
          rotation: this.textNode.rotation(),
          scale: {
            x: this.textNode.scaleX(),
            y: this.textNode.scaleY(),
          },
          zIndex: this.textNode.getZIndex(),
        },
      },
    };
    return data;
  }
  private applyTransform({
    canvasPosition,
    existingTransform,
    textChildrenTransforms,
  }: {
    canvasPosition: Position;
    existingTransform: TransformationData;
    textChildrenTransforms: TextNodeChildrenTransformData;
  }) {
    this.kNode.setAttrs({
      ...existingTransform,
      position: {
        x: existingTransform.position.x + canvasPosition.x,
        y: existingTransform.position.y + canvasPosition.y,
      },
    });
    this.rectNode.setAttrs(textChildrenTransforms.wrapperRectTransform);
    this.textNode.setAttrs(textChildrenTransforms.textNodeTransform);
  }
}
