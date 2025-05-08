import { Colors } from "../constants";

export enum NodeType {
  IMAGE = "image",
  TEXT = "text",
  VIDEO = "video",
  SHAPE = "shape",
}
export const transparent = Colors.transparent;
export const primaryOrange = Colors.primaryOrange;

export const highlightStrokeWidth = 2;
export const minNodeSize = {
  width: 200,
  height: 200,
};
