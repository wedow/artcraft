import { Position, Size, Scale } from "./basicValueTypes";

// This is meant for the transformation command
export interface Transformation {
  kNodeId: number | string;
  position: Position;
  size: Size;
  scale: Scale;
  rotation: number;
}

// This is meant for saving transformation data
// for scene saving and loading
export interface TransformationData extends Omit<Transformation, "kNodeId"> {
  zIndex: number;
}
