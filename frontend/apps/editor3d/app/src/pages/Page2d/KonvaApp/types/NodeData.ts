import { NodeType, BaseNode, ImageNode, TextNode, ShapeNode } from "../Nodes";

import { TransformationData } from "./Transformation";

import { TextNodeData } from "./Text";
import { PaintNode } from "../Nodes/PaintNode";

export type MediaNode =
  // | NetworkedNode
  BaseNode  | ImageNode | TextNode | ShapeNode | PaintNode;

export type ImageNodeData = {
  mediaFileUrl: string;
  mediaFileToken?: string;
};
export type VideoNodeData = {
  mediaFileUrl: string;
  mediaFileToken?: string;
  videoWidth?: number;
  videoHeight?: number;
  isChroma: boolean;
  chromaColor: {
    red: number;
    green: number;
    blue: number;
  };
  extractionUrl?: string;
};

export type ShapeNodeData = {
  shape: "triangle" | "square" | "circle";
}

export type NodeData = {
  type: NodeType;
  transform: TransformationData;

  // Text Node Data
  imageNodeData?: ImageNodeData;
  textNodeData?: TextNodeData;
  videoNodeData?: VideoNodeData;
};
