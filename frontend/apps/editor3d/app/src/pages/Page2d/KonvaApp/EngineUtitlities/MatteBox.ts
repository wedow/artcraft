import Konva from "konva";
import { Size } from "../types";
import { Colors } from "../constants";
import { uiAccess } from "../../signals/uiAccess";

export class MatteBox {
  private matteBoxPoly: Konva.Line;
  private lightBoxRect: Konva.Rect;
  private uiLayerRef: Konva.Layer;
  private boardCanvasSize: Size;
  private captureCanvasSize: Size;

  constructor({
    boardCanvasSize,
    captureCanvasSize,
    uiLayerRef,
  }: {
    boardCanvasSize: Size;
    captureCanvasSize: Size;
    uiLayerRef: Konva.Layer;
  }) {
    this.uiLayerRef = uiLayerRef;
    this.boardCanvasSize = boardCanvasSize;
    this.captureCanvasSize = captureCanvasSize;
    this.matteBoxPoly = new Konva.Line({
      points: getMatteBoxPolygonPoints({
        boardCanvasSize: this.boardCanvasSize,
        captureCanvasSize: this.captureCanvasSize,
      }),
      fill: Colors.translucentBlack,
      closed: true,
    });
    this.lightBoxRect = new Konva.Rect({
      size: captureCanvasSize,
      position: {
        x: (boardCanvasSize.width - captureCanvasSize.width) / 2,
        y: (boardCanvasSize.height - captureCanvasSize.height) / 2,
      },
      fill: Colors.transparent,
      // fill: "rgba(100,0,0,0.3)",
    });
  }
  public enable(showMagicBox?: boolean) {
    this.uiLayerRef.add(this.matteBoxPoly);
    this.uiLayerRef.add(this.lightBoxRect);
    if (showMagicBox) {
      uiAccess.magicBox.show();
    }
  }
  public disable() {
    this.matteBoxPoly.remove();
    this.lightBoxRect.remove();
    if (uiAccess.magicBox.isShowing()) {
      uiAccess.magicBox.hide();
    }
  }
  public updateSize({
    boardCanvasSize,
    captureCanvasSize,
  }: {
    boardCanvasSize?: Size;
    captureCanvasSize?: Size;
  }) {
    if (boardCanvasSize) {
      this.boardCanvasSize = boardCanvasSize;
    }
    if (captureCanvasSize) {
      this.captureCanvasSize = captureCanvasSize;
    }
    this.matteBoxPoly.points(
      getMatteBoxPolygonPoints({
        boardCanvasSize: this.boardCanvasSize,
        captureCanvasSize: this.captureCanvasSize,
      }),
    );
    this.lightBoxRect.setAttrs({
      size: this.captureCanvasSize,
      position: {
        x: (this.boardCanvasSize.width - this.captureCanvasSize.width) / 2,
        y: (this.boardCanvasSize.height - this.captureCanvasSize.height) / 2,
      },
    });
  }
}

function getMatteBoxPolygonPoints({
  boardCanvasSize: board,
  captureCanvasSize: capture,
}: {
  boardCanvasSize: Size;
  captureCanvasSize: Size;
}) {
  return [
    //top left
    0,
    0,
    // top right
    board.width,
    0,
    //bottom right
    board.width,
    board.height,
    //bottom middle
    board.width / 2,
    board.height,
    //canvas bottom middle,
    board.width / 2,
    (board.height - capture.height) / 2 + capture.height,
    //canvas bottom right,
    (board.width - capture.width) / 2 + capture.width,
    (board.height - capture.height) / 2 + capture.height,
    //canvas top right,
    (board.width - capture.width) / 2 + capture.width,
    (board.height - capture.height) / 2,
    //canvas top left,
    (board.width - capture.width) / 2,
    (board.height - capture.height) / 2,
    //canvas bottom left,
    (board.width - capture.width) / 2,
    (board.height - capture.height) / 2 + capture.height,
    //canvas bottom middle,
    board.width / 2,
    (board.height - capture.height) / 2 + capture.height,
    //bottom middle
    board.width / 2,
    board.height,
    //bottom left
    0,
    board.height,
    //back to top left
    0,
    0,
  ];
}
