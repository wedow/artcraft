//@ts-ignore
// TODO: have to export and modify the code
import { ICanvasConfig } from "konva/lib/Canvas";

import { Canvas } from "konva/lib/Canvas";
import { OffScreenSceneContext } from "./OffScreenSceneContext";

export class OffScreenSceneCanvas extends Canvas {
  constructor(
    config: ICanvasConfig = { width: 0, height: 0, willReadFrequently: false },
  ) {
    super(config); // creates canvas then you have to replace it
    //@ts-ignore
    // replace here also kills the css but thats ok
    this._canvas = new OffscreenCanvas(config.width, config.height);

    this.context = new OffScreenSceneContext(this, {
      willReadFrequently: config.willReadFrequently,
    });
    console.log("Created Offscreen Scene Canvas");
    this.setSize(config.width, config.height);
  }

  setPixelRatio(pixelRatio: number) {
    console.log("overriden setPixelRatio");
    var previousRatio = this.pixelRatio;
    this.pixelRatio = pixelRatio;
    this.setSize(
      this.getWidth() / previousRatio,
      this.getHeight() / previousRatio,
    );
  }
  public override setWidth(width: number) {
    // take into account pixel ratio
    // console.log("overriden setWidth");
    this.width = this._canvas.width = width * this.pixelRatio;
    var pixelRatio = this.pixelRatio,
      _context = this.getContext()._context;
    _context.scale(pixelRatio, pixelRatio);
  }
  public override setHeight(height: number) {
    // take into account pixel ratio
    // console.log("overriden setHeight");
    this.height = this._canvas.height = height * this.pixelRatio;
    var pixelRatio = this.pixelRatio,
      _context = this.getContext()._context;
    _context.scale(pixelRatio, pixelRatio);
  }
  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }
  setSize(width: number | undefined, height: number | undefined) {
    this.setWidth(width || 0);
    this.setHeight(height || 0);
  }
}
