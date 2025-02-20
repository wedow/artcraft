import { NodeType, BaseNode, ImageNode, TextNode, VideoNode, ShapeNode } from "../Nodes";

import { TransformationData } from "./Transformation";

import { TextNodeData } from "./Text";

export type MediaNode =
  // | NetworkedNode
  BaseNode | VideoNode | ImageNode | TextNode | ShapeNode;

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

export type NodeData = {
  type: NodeType;
  transform: TransformationData;

  // Text Node Data
  imageNodeData?: ImageNodeData;
  textNodeData?: TextNodeData;
  videoNodeData?: VideoNodeData;
};
