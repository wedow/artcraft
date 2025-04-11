import Konva from "konva";
import { MediaNode } from "../types";

export class NodeTransformer {
  private kTransformer: Konva.Transformer;

  constructor() {
    this.kTransformer = new Konva.Transformer({
      padding: 0,
      anchorStyleFunc: (anchor) => {
        // anchor is Konva.Rect instance
        // you manually change its styling
        anchor.cornerRadius(10);
        if (anchor.hasName("top-center") || anchor.hasName("bottom-center")) {
          anchor.height(6);
          anchor.offsetY(3);
          anchor.width(30);
          anchor.offsetX(15);
        }
        if (anchor.hasName("middle-left") || anchor.hasName("middle-right")) {
          anchor.height(30);
          anchor.offsetY(15);
          anchor.width(6);
          anchor.offsetX(3);
        }
        // if (anchor.hasName("rotater")) {
        //   anchor.offsetY(-25);
        // }
        // you also can set other properties
        // e.g. you can set fillPatternImage to set icon to the anchor
      },
    });
  }
  public getKonvaNode() {
    return this.kTransformer;
  }
  public addNodes({ selectedNodes }: { selectedNodes: Set<MediaNode> }) {
    const kNodesArray = Array.from(selectedNodes).reduce((acc, node) => {
      acc.push(node.kNode);
      return acc;
    }, [] as Konva.Node[]);

    //if there are more things in the ui layer, turn this on
    // this.kTransformer.moveToTop();

    this.kTransformer.nodes(kNodesArray);
  }
  public clear() {
    this.kTransformer.nodes([]);
  }
  public enable() {
    this.kTransformer.rotateEnabled(true);
    this.kTransformer.resizeEnabled(true);
    this.kTransformer.draggable(true);
  }
  public disable() {
    this.kTransformer.rotateEnabled(false);
    this.kTransformer.resizeEnabled(false);
    this.kTransformer.draggable(false);
  }
}
