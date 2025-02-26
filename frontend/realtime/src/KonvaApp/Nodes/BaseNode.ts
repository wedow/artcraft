import Konva from "konva";

import { SelectionManager } from "../NodesManagers";
import { highlightStrokeWidth, primaryOrange } from "./constants";
import { NodeData, Position } from "../types";
import { RealTimeDrawEngine } from "../RenderingPrimitives/RealTimeDrawEngine";
import { MouseEventHandler } from "react";
import { KonvaEventObject } from "konva/lib/Node";

export abstract class BaseNode {
  protected selectionManagerRef: SelectionManager;
  public kNode: Konva.Image | Konva.Group;
  protected mediaLayerRef: Konva.Layer;

  // Internal State members
  // do not modify internal
  protected isSelecting: boolean = false;
  // This locks interaction when the render engine is rendering
  protected isProcessing: boolean = false;
  protected _isLocked: boolean = false;
  protected _areBaseEventsListening: boolean = false;
  protected _isKDragEventListening: boolean = false;
  protected _isKTranformEventListening: boolean = false;

  abstract getNodeData(captureCanvasPosition: Position): NodeData | null;

  constructor({
    selectionManagerRef,
    mediaLayerRef,
    kNode,
  }: {
    selectionManagerRef: SelectionManager;
    mediaLayerRef: Konva.Layer;
    kNode: Konva.Image | Konva.Group | Konva.Shape;
  }) {
    // console.log("Node constructed");
    // this.uuid = uuidv4();
    this.mediaLayerRef = mediaLayerRef;
    this.selectionManagerRef = selectionManagerRef;
    this.kNode = kNode;
  }

  protected delete() {
    // Do any other clean up and delete the konva node.
    this.kNode.destroy();
  }
  public async setProcessing(val: boolean) {
    this.isProcessing = val;
  }
  public isKEventRef() {
    return this._isKDragEventListening && this._isKTranformEventListening;
  }
  public setIsKEventRef(flag: boolean) {
    this._isKDragEventListening = flag;
    this._isKTranformEventListening = flag;
    this.removeListenToBaseKNodeTransformations();
    this.removeListenToBaseKNodeDrags();
    if (flag) {
      this.listenToBaseKNodeTransformations();
      this.listenToBaseKNodeDrags();
    }
  }
  public highlight() {
    // console.log("Highlight", this.kNode._id);
    if (this.kNode instanceof Konva.Image) {
      this.kNode.stroke(primaryOrange);
      this.kNode.strokeWidth(highlightStrokeWidth);
      return;
    }
    if (this.kNode instanceof Konva.Group) {
      const wrapperRect = this.kNode.findOne(".wrapper") as Konva.Rect;
      console.log("Wrapper rect:", wrapperRect);
      if (wrapperRect != null) {
        wrapperRect.stroke(primaryOrange);
        wrapperRect.strokeWidth(highlightStrokeWidth);
      }
      return;
    }
    if (import.meta.env.DEV) {
      console.warn(
        "DEV: BaseNode Highlight Error, kNode of BaseNode should be override by MediaNodes that extends kNode",
      );
    }
  }

  public unhighlight() {
    // console.log("unHighlight", this.kNode._id);
    if (this.kNode instanceof Konva.Image) {
      this.kNode.strokeWidth(0);
      return;
    }
    if (this.kNode instanceof Konva.Group) {
      const wrapperRect = this.kNode.findOne(".wrapper") as Konva.Rect;
      console.log("Wrapper rect:", wrapperRect);
      if (wrapperRect != null) {
        // Issue investigate
        wrapperRect.strokeWidth(0);
      }
      return;
    }
    if (import.meta.env.DEV) {
      console.warn(
        "DEV: BaseNode UnHighlight Error, kNode of BaseNode should be override by MediaNodes that extends kNode",
      );
    }
  }

  public moveLayerUp() {
    this.kNode.moveUp();
  }
  public moveLayerDown() {
    this.kNode.moveDown();
  }
  public isLocked() {
    return this._isLocked;
  }
  public lock() {
    this._isLocked = true;
    this.kNode.setDraggable(false);
    this.selectionManagerRef.updateNodeTransformer();
    if (this.isKEventRef()) {
      this.selectionManagerRef.updateContextComponents();
    }
  }
  public unlock() {
    this._isLocked = false;
    this.kNode.setDraggable(true);
    this.selectionManagerRef.updateNodeTransformer();
    if (this.isKEventRef()) {
      this.selectionManagerRef.updateContextComponents();
    }
  }

  public listenToBaseKNode() {
    if (this._areBaseEventsListening) {
      return;
    }
    this._areBaseEventsListening = true;
    const handleSelect = (isMultiSelect: boolean) => {
      // console.log("handle select");
      if (!isMultiSelect) {
        // clear selection if not multislect
        console.log("No Shift >> no multiselect");
        this.selectionManagerRef.clearSelection();
      }
      if (this.selectionManagerRef.isNodeSelected(this)) {
        this.selectionManagerRef.deselectNode(this);
        return;
      }
      if (this.isSelecting) {
        this.selectionManagerRef.selectNode(this);
        return;
      }
    };

    const handleRightClick = (e: KonvaEventObject<MouseEvent>) => {
      this.selectionManagerRef.clearSelection();
      this.selectionManagerRef.selectNode(this, undefined, {
        show: true,
        at: { x: e.evt.x, y: e.evt.y }
      });
    }

    this.kNode.on("contextmenu", (e) => {
      console.log("CONTEXT MENU", e);
      e.evt.preventDefault();
      handleRightClick(e);
    });

    this.kNode.on("mousedown", (e) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/which
      // 3: Right mouse button
      // If right click, let context event handle it
      if (e.evt.button === 2) {
        return;
      }

      // Selection of Node
      if (!this.selectionManagerRef.isNodeSelected(this)) {
        this.isSelecting = true;
        // send shift key to check for multiselect
        handleSelect(e.evt.shiftKey);
      }
    });

    this.kNode.on("mouseup", (e) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent/which
      // 3: Right mouse button
      // If right click, let context event handle it
      if (e.evt.button === 2) {
        return;
      }

      // just coming out of dragging or selecting mode
      // no need to handle select
      if (this.selectionManagerRef.isDragging() || this.isSelecting) {
        this.isSelecting = false;
        return;
      }

      // checking for multiselect, in multiselect deselection is possible
      handleSelect(e.evt.shiftKey);
    });
  }
  public removeListenToBaseKNode() {
    this._areBaseEventsListening = false;
    this.kNode.removeEventListener("mousedown mouseup");
  }
  private handleDragStart = () => {
    console.log("Drag start", this.kNode._id);
    if (this.isProcessing) {
      return;
    }
    this.selectionManagerRef.dragStart();
  };

  private handleDragEnd = () => {
    this.selectionManagerRef.dragEnd();
  };

  public listenToBaseKNodeDrags() {
    this.kNode.on("dragstart", this.handleDragStart);
    this.kNode.on("dragend", this.handleDragEnd);
  }

  public removeListenToBaseKNodeDrags() {
    this.kNode.off("dragstart", this.handleDragStart);
    this.kNode.off("dragend", this.handleDragEnd);
  }
  public listenToBaseKNodeTransformations() {
    this.kNode.on("transformstart", (event) => {
      console.log("transformstart", event.target._id);
      this.selectionManagerRef.transformStart();
    });
    this.kNode.on("transform", () => {
      this.kNode.setAttrs({
        width: this.kNode.width() * this.kNode.scaleX(),
        height: this.kNode.height() * this.kNode.scaleY(),
        scaleX: 1,
        scaleY: 1,
      });
    });
    this.kNode.on("transformend", (event) => {
      console.log("transformend", event.target._id);
      this.selectionManagerRef.transformEnd();
    });
  }
  public removeListenToBaseKNodeTransformations() {
    this.kNode.removeEventListener("transformend");
  }
}
