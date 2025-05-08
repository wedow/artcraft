import Konva from "konva";
import { MediaNode, TransformationData } from "../types";
import { uiAccess } from "../../signals/uiAccess";

export class NodeIsolator {
  private mediaLayerRef: Konva.Layer;
  private backgroundRect: Konva.Rect;
  private referenceRect: Konva.Rect;
  private nodeIsolationLayerRef: Konva.Layer;
  private currentNode: MediaNode | undefined;
  private originalKNodeTransformation: TransformationData | undefined;
  private adjustSizeFnRef: (() => void) | undefined;

  constructor({
    mediaLayerRef,
    nodeIsolationLayerRef,
  }: {
    mediaLayerRef: Konva.Layer;
    nodeIsolationLayerRef: Konva.Layer;
  }) {
    this.mediaLayerRef = mediaLayerRef;
    this.nodeIsolationLayerRef = nodeIsolationLayerRef;
    this.backgroundRect = new Konva.Rect({
      fill: "rgba(0,0,0,0.5)",
    });
    this.referenceRect = new Konva.Rect({
      fill: "gray",
      stroke: "salmon",
      strokeWidth: 10,
      dash: [20, 10],
      strokeScaleEnabled: false,
    });
  }

  private adjustSizes() {
    this.backgroundRect.setAttrs({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    if (this.currentNode && this.originalKNodeTransformation) {
      this.referenceRect.setAttrs(this.originalKNodeTransformation);

      const originalSize = {
        width:
          this.originalKNodeTransformation.size.width *
          this.originalKNodeTransformation.scale.x,
        height:
          this.originalKNodeTransformation.size.height *
          this.originalKNodeTransformation.scale.y,
      };
      const maxWidth = window.innerWidth * 0.8;
      const isolationResize = {
        width: maxWidth,
        height: (maxWidth / originalSize.width) * originalSize.height,
      };
      const maxHeight = window.innerHeight - 350;
      if (isolationResize.height > maxHeight) {
        isolationResize.height = maxHeight;
        isolationResize.width =
          (maxHeight / originalSize.height) * originalSize.width;
      }
      const isolationReposition = {
        x: (window.innerWidth - isolationResize.width) / 2,
        y: (maxHeight - isolationResize.height) / 2 + 100,
      };
      this.currentNode.kNode.setAttrs({
        scale: { x: 1, y: 1 },
        rotation: 0,
        size: isolationResize,
        position: isolationReposition,
      });
    }
  }
  public enterIsolation(node: MediaNode) {
    // console.log("NodeIsolator > enterIsolation");
    uiAccess.toolbarMain.disable();
    this.currentNode = node;
    this.adjustSizeFnRef = () => this.adjustSizes();
    this.preserveKNodeTransformation(node.kNode);

    this.currentNode.kNode.remove();
    this.nodeIsolationLayerRef.add(this.backgroundRect);
    this.nodeIsolationLayerRef.add(this.currentNode.kNode);
    this.mediaLayerRef.add(this.referenceRect);
    this.adjustSizeFnRef();

    window.addEventListener("resize", this.adjustSizeFnRef);
  }

  public exitIsolation() {
    // console.log("NodeIsolator > exitIsolation");
    if (this.adjustSizeFnRef) {
      window.removeEventListener("resize", this.adjustSizeFnRef);
      this.adjustSizeFnRef = undefined;
    }
    if (!this.currentNode) {
      console.error("NodeIsolator lost crrent node before isolation!!");
      return;
    }
    this.currentNode.kNode.remove();
    this.backgroundRect.remove();
    this.referenceRect.remove();
    this.mediaLayerRef.add(this.currentNode.kNode);
    this.currentNode.kNode.setAttrs(this.originalKNodeTransformation);
    this.currentNode = undefined;
    this.originalKNodeTransformation = undefined;
    uiAccess.toolbarMain.enable();
  }
  private preserveKNodeTransformation(kNode: Konva.Node) {
    this.originalKNodeTransformation = {
      position: kNode.position(),
      size: kNode.size(),
      rotation: kNode.rotation(),
      scale: {
        x: kNode.scaleX(),
        y: kNode.scaleY(),
      },
      zIndex: kNode.zIndex(),
    };
  }
}
