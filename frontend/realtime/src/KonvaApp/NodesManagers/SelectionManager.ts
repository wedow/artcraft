import Konva from "konva";
import { NodeTransformer } from "./NodeTransformer";
import { MediaNode, Position, Transformation } from "../types";
import { uiAccess, uiEvents } from "~/signals";
import { NetworkedNode } from "../Nodes/NetworkedNode";
import { LoadingBarStatus } from "~/components/ui";
import { ImageNode, ShapeNode, TextNode, VideoNode } from "../Nodes";
import {
  calculateContextualsPosition,
  getImageNodeButtonStates,
  getMultiSelectButtonStates,
  getShapeNodeButtonStates,
  getTextNodeButtonStates,
  getVideoNodeButtonStates,
} from "./ToolbarNodeUtilities";

export enum SelectionManagerEvents {
  NODES_TRANSLATIONS = "nodestranslation",
  NODES_TRANSFORMATION = "nodestransformation",
}
export interface NodesTranslationEventDetails {
  nodes: Set<MediaNode>;
  initialPositions: Map<MediaNode, Position>;
  finalPositions: Map<MediaNode, Position>;
}
export interface NodeTransformationEventDetails {
  nodes: Set<MediaNode>;
  initialTransformations: Map<MediaNode, Transformation[]>;
  finalTransformations: Map<MediaNode, Transformation[]>;
}

export class SelectionManager {
  private selectedNodes: Set<MediaNode>;
  private mediaLayerRef: Konva.Layer;
  private nodeTransformerRef: NodeTransformer;
  private initialPositions: Map<MediaNode, Position>;
  private initialTransformations: Map<MediaNode, Transformation[]>;
  public eventTarget: EventTarget;
  private _isDragging: boolean = false;
  private disabled: boolean = false;

  public firstSelectedNode: MediaNode | undefined;

  constructor({
    mediaLayerRef,
    nodeTransformerRef,
  }: {
    mediaLayerRef: Konva.Layer;
    nodeTransformerRef: NodeTransformer;
  }) {
    this.firstSelectedNode = undefined;
    this.selectedNodes = new Set();

    this.initialPositions = new Map<MediaNode, Position>();
    this.initialTransformations = new Map<MediaNode, Transformation[]>();
    this.eventTarget = new EventTarget();
    this.mediaLayerRef = mediaLayerRef;
    this.nodeTransformerRef = nodeTransformerRef;
  }
  // This lets us perfom operations on the selected node.
  public getSelectedNodes(): Set<MediaNode> {
    return this.selectedNodes;
  }
  public selectNodes(nodes: MediaNode[]) {
    const unlockedNodes = nodes.filter((node) => {
      return !node.isLocked();
    });
    unlockedNodes.forEach((node) => {
      this.selectNode(node, true);
    });
    this.mediaLayerRef.batchDraw();
  }
  public disable() {
    this.clearSelection();
    this.disabled = true;
  }
  public enable() {
    this.disabled = false;
  }
  public isDisabled() {
    return this.disable;
  }
  public selectNode(node: MediaNode, doNotDraw?: boolean): boolean {
    if (
      this.disabled || // no-op when disabled
      this.selectedNodes.has(node) || // if the node is already selected
      (this.selectedNodes.size > 0 && node.isLocked()) ||
      // if in multiselect but picked a locked item
      (this.selectedNodes.size > 0 &&
        this.selectedNodes.values().next().value?.isLocked())
      // if the first node picked is a locked item
    ) {
      return false;
    }

    node.highlight();
    if (this.selectedNodes.size === 0) {
      node.setIsKEventRef(true);
    }
    this.selectedNodes.add(node);
    this.updateNodeTransformer();
    this.updateContextComponents();
    this.showContextComponents();

    if (!doNotDraw) {
      this.mediaLayerRef.batchDraw();
    }
    return true;
  }

  public deselectNode(node: MediaNode, doNotDraw?: boolean): void {
    if (this.disabled) {
      // no-op when disabled
      return;
    }
    node.unhighlight();
    if (node.isKEventRef()) {
      node.setIsKEventRef(false);
    }
    this.selectedNodes.delete(node);
    this.updateNodeTransformer();
    this.updateContextComponents();
    this.showContextComponents();
    if (!doNotDraw) {
      this.mediaLayerRef.batchDraw();
    }
  }

  public clearSelection(): void {
    if (this.disabled) {
      //no-op when disabled
      return;
    }
    this.selectedNodes.forEach((node) => {
      node.unhighlight();
      if (node.isKEventRef()) {
        node.setIsKEventRef(false);
      }
    });

    this.selectedNodes.clear();
    this.nodeTransformerRef.clear();
    this.hideContextComponents();
    this.mediaLayerRef.batchDraw();
  }

  public onToggleLock() {
    this.updateContextComponents();
  }
  public isDragging() {
    return this._isDragging;
  }
  public isNodeSelected(node: MediaNode): boolean {
    return this.selectedNodes.has(node);
  }

  public dragStart() {
    // track the dragging state for mouseevents in nodes
    this._isDragging = true;
    this.hideContextComponents();

    // track all nodes initial position when dragstart
    this.selectedNodes.forEach((selectedNode) => {
      this.initialPositions.set(selectedNode, selectedNode.kNode.position());
    });
  }

  public dragEnd() {
    // release the dragging state for mouseevents in nodes
    this._isDragging = false;
    // track and map the final positions
    const finalPositions = new Map<MediaNode, Position>();
    this.selectedNodes.forEach((currNode) => {
      finalPositions.set(currNode, currNode.kNode.position());
    });
    // dispatch the info for engine to manage un-redo stack
    this.eventTarget.dispatchEvent(
      new CustomEvent<NodesTranslationEventDetails>(
        SelectionManagerEvents.NODES_TRANSLATIONS,
        {
          detail: {
            nodes: this.selectedNodes,
            initialPositions: new Map(this.initialPositions),
            finalPositions: finalPositions,
          },
        },
      ),
    );
    // done, clear data and show menu
    this.initialPositions.clear();
    this.updateContextComponents();
    this.showContextComponents();
  }
  private getKNodeTransformation(kNode: Konva.Node) {
    return {
      kNodeId: kNode._id,
      position: kNode.position(),
      size: kNode.size(),
      rotation: kNode.rotation(),
      scale: {
        x: kNode.scaleX(),
        y: kNode.scaleY(),
      },
    };
  }
  public transformStart() {
    // track all nodes initial transformation when transformStart
    this.selectedNodes.forEach((selectedNode) => {
      const transformations = [this.getKNodeTransformation(selectedNode.kNode)];
      if (selectedNode.kNode instanceof Konva.Group) {
        const childKNodes = selectedNode.kNode.getChildren();
        childKNodes.forEach((childKNode: Konva.Node) => {
          transformations.push(this.getKNodeTransformation(childKNode));
        });
      }
      this.initialTransformations.set(selectedNode, transformations);
    });
    this.hideContextComponents();
  }
  public transformEnd() {
    // track and map the final positions
    const finalTransformations = new Map<MediaNode, Transformation[]>();
    this.selectedNodes.forEach((selectedNode) => {
      const transformations = [this.getKNodeTransformation(selectedNode.kNode)];
      if (selectedNode.kNode instanceof Konva.Group) {
        const childKNodes = selectedNode.kNode.getChildren();
        childKNodes.forEach((childKNode: Konva.Node) => {
          transformations.push(this.getKNodeTransformation(childKNode));
        });
      }
      finalTransformations.set(selectedNode, transformations);
    });
    // dispatch the info for engine to manage un-redo stack
    this.eventTarget.dispatchEvent(
      new CustomEvent<NodeTransformationEventDetails>(
        SelectionManagerEvents.NODES_TRANSFORMATION,
        {
          detail: {
            nodes: this.selectedNodes,
            initialTransformations: new Map(this.initialTransformations),
            finalTransformations: finalTransformations,
          },
        },
      ),
    );
    this.updateContextComponents();
    this.showContextComponents();
  }

  public updateNodeTransformer() {
    const lockFlag = this.selectedNodes.values().next().value?.isLocked();
    if (lockFlag) {
      this.nodeTransformerRef.disable();
    } else {
      this.nodeTransformerRef.enable();
    }
    this.nodeTransformerRef.addNodes({ selectedNodes: this.selectedNodes });
  }

  public hideContextComponents() {
    uiAccess.toolbarNode.hide();
    uiAccess.loadingBar.hide();
  }

  public showContextComponents() {
    const showOrUpdate = uiAccess.toolbarNode.isShowing()
      ? uiAccess.toolbarNode.update
      : uiAccess.toolbarNode.show;
    const node = this.selectedNodes.values().next().value;
    if (node === undefined) {
      this.hideContextComponents();
      return; // no node
    }
    if (this.selectedNodes.size === 1) {
      if (node instanceof ImageNode) {
        showOrUpdate({
          knodeIds: [node.kNode.id()],
          locked: node.isLocked(),
          buttonStates: getImageNodeButtonStates({ locked: node.isLocked() }),
        });
      }
      else if (node instanceof ShapeNode) {
        console.debug("Selected node is of type ShapeNode", node.kNode.id())
        showOrUpdate({
          knodeIds: [node.kNode.id()],
          locked: node.isLocked(),
          buttonStates: getShapeNodeButtonStates({ locked: node.isLocked() }),
          color: node.getNodeData({ x: 0, y: 0 })?.textNodeData?.color ?? "#000000",
        });
      }
      else if (node instanceof TextNode) {
        showOrUpdate({
          knodeIds: [node.kNode.id()],
          locked: node.isLocked(),
          buttonStates: getTextNodeButtonStates({ locked: node.isLocked() }),
          color: node.getNodeData({ x: 0, y: 0 })?.textNodeData?.color ?? "#000000",
        });
      }
      else if (node instanceof VideoNode) {
        showOrUpdate({
          locked: node.isLocked(),
          buttonStates: getVideoNodeButtonStates({ locked: node.isLocked() }),
        });
      }

      // show loading bar is the node is noding
      if (node instanceof NetworkedNode) {
        if (!node.didFinishLoading && !uiAccess.loadingBar.isShowing()) {
          // console.log("show loading bar");
          uiAccess.loadingBar.show();
        }
      }
    } else {
      if (node) {
        showOrUpdate({
          locked: node.isLocked(),
          buttonStates: getMultiSelectButtonStates({ locked: node.isLocked() }),
        });
      }
    }
  }

  public updateContextComponents() {
    // use first node as reference
    const node = this.selectedNodes.values().next().value;
    if (node === undefined) {
      this.hideContextComponents();
      return; // no nodes
    }

    // console.log("SelectionManager > updateContextComponents for node:", node);
    const coord = calculateContextualsPosition(
      this.nodeTransformerRef.getKonvaNode(),
    );

    if (node instanceof VideoNode) {
      if (node.isSegmentationMode && !uiAccess.toolbarNode.isLockDisabled()) {
        uiAccess.toolbarNode.disableLock();
      } else {
        uiAccess.toolbarNode.enableLock();
      }
    }
    if (node.isLocked() !== uiAccess.toolbarNode.isLocked()) {
      // console.log("setting lock");
      uiAccess.toolbarNode.setLocked(node.isLocked());
    }
    uiAccess.toolbarNode.setPosition({
      x: coord.x,
      y: coord.y,
    });
    if (node instanceof NetworkedNode) {
      uiAccess.loadingBar.update({
        position: coord,
        progress: node.progress(),
        status: node.isError()
          ? LoadingBarStatus.ERROR
          : LoadingBarStatus.LOADING,
        message: node.progressMessage(),
      });
      uiEvents.toolbarNode.retry.onClick((e) => {
        if (e) {
          console.log("CONTEXTUAL LOADING BAR RETRY ONCLICK", e, node);
          node.retry();
        }
      });
      if (node.didFinishLoading) {
        // console.log("node finished loading", node);
        uiAccess.loadingBar.hide();
      }
    }
  }
}
