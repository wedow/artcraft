import Konva from "konva";
import { NodesManager } from "./NodesManager";
import { SelectionManager } from "./SelectionManager";
import { MediaNode } from "../types";

interface SqaureCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
export class SelectorSquare {
  private kSquare: Konva.Rect;
  private selecting: boolean = false;
  private sqaureCoordinates: SqaureCoordinates = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
  };

  // engine class references
  private captureCanvasRef: Konva.Rect;
  private mediaLayerRef: Konva.Layer;
  private nodesManagerRef: NodesManager;
  private selectionManagerRef: SelectionManager;
  private stageRef: Konva.Stage;

  constructor({
    captureCanvasRef,
    mediaLayerRef,
    nodesManagerRef,
    selectionManagerRef,
    stageRef,
  }: {
    captureCanvasRef: Konva.Rect;
    mediaLayerRef: Konva.Layer;
    nodesManagerRef: NodesManager;
    selectionManagerRef: SelectionManager;
    stageRef: Konva.Stage;
  }) {
    this.kSquare = new Konva.Rect({
      fill: "rgba(45, 129, 255, 0.3)",
      stroke: "#00a1ff",
      strokeWidth: 1,
      visible: false,
      // disable events to not interrupt with events
      listening: false,
    });
    this.captureCanvasRef = captureCanvasRef;
    this.mediaLayerRef = mediaLayerRef;
    this.nodesManagerRef = nodesManagerRef;
    this.selectionManagerRef = selectionManagerRef;
    this.stageRef = stageRef;
  }
  public getKonvaNode() {
    return this.kSquare;
  }

  public disable() {
    this.stageRef.off("mousedown touchstart");
    this.stageRef.off("mousemove touchmove");
    this.stageRef.off("mouseup touchend");
  }
  public enable() {
    this.stageRef.on("mousedown touchstart", (e) => {
      const stagePointerPos = this.stageRef.getPointerPosition();
      if (
        (e.target !== this.stageRef && e.target !== this.captureCanvasRef) || // do nothing if we mousedown on any shape
        stagePointerPos === null || // do nothing if pointers not available
        e.evt.shiftKey // do nothing so then multiselect is more forgiving in misclicks
      ) {
        return;
      }

      // start handle mousedown
      e.evt.preventDefault();
      if (e.target === this.stageRef || e.target === this.captureCanvasRef) {
        //moused down on empty space, clear previous selection first
        this.selectionManagerRef.clearSelection();
      }

      // this starts drawing the square
      this.sqaureCoordinates = {
        x1: stagePointerPos.x,
        y1: stagePointerPos.y,
        x2: stagePointerPos.x,
        y2: stagePointerPos.y,
      };
      this.kSquare.size({
        width: 0,
        height: 0,
      });
      this.selecting = true;
    });

    this.stageRef.on("mousemove touchmove", (e) => {
      // do nothing if we didn't start selection
      const stagePointerPos = this.stageRef.getPointerPosition();
      if (!this.selecting || stagePointerPos === null) {
        return;
      }

      // handle drawing square according to mouse move
      e.evt.preventDefault();
      this.sqaureCoordinates = {
        ...this.sqaureCoordinates,
        x2: stagePointerPos.x,
        y2: stagePointerPos.y,
      };
      const { x1, y1, x2, y2 } = this.sqaureCoordinates;
      this.kSquare.moveToTop();
      this.kSquare.setAttrs({
        visible: true,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      });

      this.stageRef.on("mouseup touchend", (e) => {
        // do nothing if we didn't start selection
        this.selecting = false;
        if (!this.kSquare.visible()) {
          return;
        }
        e.evt.preventDefault();
        // update visibility
        this.kSquare.visible(false);
        // Find all the Nodes and feed them into Selectmanager
        var shapes = this.mediaLayerRef.getChildren();
        var box = this.kSquare.getClientRect();
        var foundKNodes = shapes.filter((shape) =>
          Konva.Util.haveIntersection(box, shape.getClientRect()),
        );
        if (foundKNodes.length > 0) {
          const kNodeIds = foundKNodes.map((kNode) => kNode._id);
          const foundNodes = Array.from(
            this.nodesManagerRef.getAllNodes(),
          ).reduce((accNodes, currNode) => {
            if (kNodeIds.includes(currNode.kNode._id) && !currNode.isLocked()) {
              accNodes.push(currNode);
            }
            return accNodes;
          }, [] as MediaNode[]);
          console.log("selector square found", foundNodes);
          this.selectionManagerRef.selectNodes(foundNodes);
        }
      });

      this.stageRef.on("mouseleave", (e) => {
        this.selecting = false;
        if (!this.kSquare.visible()) {
          return;
        }
        e.evt.preventDefault();
        // update visibility
        this.kSquare.visible(false);
        // and then do nothing, this is considered a cancel
      });
    });
  }
}
