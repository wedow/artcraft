import { Vector2d } from "konva/lib/types";

export interface Position extends Vector2d {}
export interface Scale extends Vector2d {}
export interface Size {
  width: number;
  height: number;
}

export interface RGBColor {
  red: number;
  green: number;
  blue: number;
}
