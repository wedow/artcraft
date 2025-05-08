import { Context } from "konva/lib/Context";
import { Canvas } from "konva/lib/Canvas";

export class OffScreenSceneContext extends Context {
  constructor(canvas: Canvas, { willReadFrequently = false } = {}) {
    super(canvas);
    this._context = canvas._canvas.getContext("2d", {
      willReadFrequently,
    }) as CanvasRenderingContext2D;
  }
}
