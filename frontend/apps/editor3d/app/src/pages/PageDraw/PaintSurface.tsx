import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Circle,
  Line,
  Image,
  RegularPolygon,
  Transformer,
} from "react-konva";
import Konva from "konva";
import { LineNode, useSceneStore } from "./stores/SceneState";
import { Node } from "./Node";
import { useStageSnapshot } from "./hooks/useUpdateSnapshot";
import "./App.css";
import SplitPane from "./components/ui/SplitPane";
import { useRightPanelLayoutManagement } from "./hooks/useRightPanelLayoutManagement";
import { useStageCentering } from "./hooks/useCenteredStage";
import { useGlobalMouseUp } from "./hooks/useGlobalMouseUp";

type MiraiProps = {
  nodes: Node[];
  selectedNodeIds: string[];
  onCanvasSizeChange?: (width: number, height: number) => void;
  fillColor?: string;
  activeTool?: "select" | "draw" | "eraser" | "backgroundColor" | "shape";
  brushColor?: string;
  brushSize?: number;
  onSelectionChange?: (isSelecting: boolean) => void;
  stageRef: React.RefObject<Konva.Stage>;
  transformerRefs: React.RefObject<{ [key: string]: Konva.Transformer }>;
};

export const PaintSurface = ({
  nodes,
  selectedNodeIds,
  onCanvasSizeChange,
  fillColor,
  activeTool = "select",
  brushColor = "#000000",
  brushSize = 5,
  onSelectionChange,
  stageRef,
  transformerRefs,
}: MiraiProps) => {
  const singlePaneMode = true;

  const store = useSceneStore();
  const imageRef = React.useRef<Konva.Image>(null);
  const leftPanelRef = React.useRef<Konva.Layer>(null);
  const rightContainerRef = React.useRef<HTMLDivElement>(null);
  const cursorLayerRef = React.useRef<Konva.Layer>(null);
  const cursorShapeRef = React.useRef<Konva.Circle>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 56,
  });

  const leftPanelWidth = 1024;
  const leftPanelHeight = 1024;
  const rightPanelWidth = 1024;
  const rightPanelHeight = 1024;

  const [leftPct, setLeftPct] = useState(singlePaneMode ? 100 : 50);
  const [isDrawing, setIsDrawing] = useState(false);
  const [, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  const selectionRectRef = React.useRef<Konva.Rect>(null);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isSelectingRef = React.useRef(false);
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);

  const [isDrawingShape, setIsDrawingShape] = useState(false);
  const [currentShapeId, setCurrentShapeId] = useState<string | null>(null);
  const [shapeStartPoint, setShapeStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [shapePreview, setShapePreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [leftPct]);

  const stagePosition = useStageCentering(
    stageRef,
    leftPct,
    leftPanelWidth,
    leftPanelHeight,
  );

  const NATURAL_WIDTH = rightPanelWidth;
  const NATURAL_HEIGHT = rightPanelHeight;

  const multiSelectTransformerRef = React.useRef<Konva.Transformer>(null);

  useStageSnapshot(stageRef, imageRef, isSelectingRef, transformerRefs);

  const previewScale = useRightPanelLayoutManagement(
    rightContainerRef,
    NATURAL_WIDTH,
    NATURAL_HEIGHT,
    leftPct,
    onCanvasSizeChange,
  );

  useGlobalMouseUp(
    setIsDragging,
    setIsDrawing,
    setCurrentLineId,
    setIsSelecting,
    isSelectingRef,
    setSelectionRect,
    setLastPoint,
    onSelectionChange,
  );

  const clampToLeftPanel = (point: {
    x: number;
    y: number;
  }): { x: number; y: number } => {
    return {
      x: Math.max(0, Math.min(point.x, store.getAspectRatioDimensions().width)),
      y: Math.max(
        0,
        Math.min(point.y, store.getAspectRatioDimensions().height),
      ),
    };
  };

  const isWithinLeftPanel = (point: { x: number; y: number }): boolean => {
    return (
      point.x >= 0 &&
      point.x <= store.getAspectRatioDimensions().width &&
      point.y >= 0 &&
      point.y <= store.getAspectRatioDimensions().height
    );
  };

  const draggableIfToolsNotActive = (
    activeTool: string,
    nodeDraggable: boolean,
  ): boolean => {
    return (
      activeTool !== "draw" &&
      activeTool !== "eraser" &&
      activeTool !== "shape" &&
      nodeDraggable
    );
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;

    const stagePoint = {
      x: (point.x - stage.x()) / stage.scaleX(),
      y: (point.y - stage.y()) / stage.scaleY(),
    };

    // Check if the target is a transformer or its children (handles)
    const isTransformerTarget =
      e.target.getClassName() === "Transformer" ||
      e.target.getParent()?.getClassName() === "Transformer" ||
      e.target.name()?.includes("_anchor") ||
      e.target.name()?.includes("rotater");

    if (!isWithinLeftPanel(stagePoint) && !isTransformerTarget) {
      setIsDragging(true);
      return;
    }

    if (
      "button" in e.evt &&
      ((e.evt as MouseEvent).button === 1 || (e.evt as MouseEvent).button === 2)
    ) {
      if (!isTransformerTarget) {
        setIsDragging(true);
      }
      return;
    }

    if (
      (activeTool === "draw" || activeTool === "eraser") &&
      isWithinLeftPanel(stagePoint)
    ) {
      const lineId = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const opacity = activeTool === "draw" ? store.brushOpacity : 1;

      const newLineNode: LineNode = {
        id: lineId,
        type: "line",
        points: [stagePoint.x, stagePoint.y],
        stroke: activeTool === "draw" ? brushColor : fillColor || "#ffffff",
        strokeWidth: brushSize / stage.scaleX(),
        draggable: true,
        opacity: opacity,
        locked: false,
        zIndex: store.lineNodes.length,
      };
      store.selectNode(null);
      store.addLineNode(newLineNode, false);
      setCurrentLineId(lineId);
      setIsDrawing(true);
      setLastPoint(stagePoint);
      return;
    }

    if (activeTool === "select" && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      if (!stage) return;
      const point = stage.getPointerPosition();
      if (!point) return;

      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      const clampedPoint = clampToLeftPanel(stagePoint);

      setIsSelecting(true);
      isSelectingRef.current = true;
      onSelectionChange?.(true);
      setSelectionRect({
        startX: clampedPoint.x,
        startY: clampedPoint.y,
        endX: clampedPoint.x,
        endY: clampedPoint.y,
      });
    }

    if (
      activeTool === "shape" &&
      store.currentShape &&
      isWithinLeftPanel(stagePoint) &&
      e.target === e.target.getStage()
    ) {
      const id = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const commonProps = {
        id,
        x: stagePoint.x,
        y: stagePoint.y,
        width: 1,
        height: 1,
        fill: store.shapeColor,
        stroke: "#444",
        strokeWidth: 2,
        draggable: true,
      } as const;

      let newNode: Node;
      switch (store.currentShape) {
        case "circle":
          newNode = new Node({ ...commonProps, type: "circle" });
          break;
        case "triangle":
          newNode = new Node({ ...commonProps, type: "triangle" });
          break;
        case "rectangle":
        default:
          newNode = new Node({ ...commonProps, type: "rectangle" });
          break;
      }

      store.addNode(newNode);
      setIsDrawingShape(true);
      setCurrentShapeId(id);
      setShapeStartPoint(stagePoint);
      setShapePreview({
        x: stagePoint.x,
        y: stagePoint.y,
        width: 0,
        height: 0,
      });
      return;
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (pointer) {
      const stagePoint = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      const isWithinCanvas = isWithinLeftPanel(stagePoint);

      if (activeTool === "draw" || activeTool === "eraser") {
        if (isWithinCanvas || isDrawing) {
          stage.container().style.cursor = "none";
          store.setCursorPosition(pointer);
          store.setCursorVisible(true);
        } else {
          stage.container().style.cursor = "grab";
          store.setCursorVisible(false);
        }
      } else if (activeTool === "shape") {
        if (isWithinCanvas) {
          stage.container().style.cursor = "crosshair";
        } else {
          stage.container().style.cursor = "grab";
        }
        store.setCursorVisible(false);
      } else {
        if (isWithinCanvas) {
          stage.container().style.cursor = "default";
        } else {
          stage.container().style.cursor = "grab";
        }
        store.setCursorVisible(false);
      }
    }

    if (isDragging) {
      const currentStage = e.target.getStage();
      if (!currentStage) return;

      currentStage.container().style.cursor = "grabbing";

      const dragSensitivity = 3.0;
      let newPos = { x: currentStage.x(), y: currentStage.y() };
      if ("movementX" in e.evt && "movementY" in e.evt) {
        newPos = {
          x:
            currentStage.x() +
            (e.evt as MouseEvent).movementX * dragSensitivity,
          y:
            currentStage.y() +
            (e.evt as MouseEvent).movementY * dragSensitivity,
        };
      }
      currentStage.position(newPos);
      return;
    }

    if (
      isDrawing &&
      currentLineId &&
      (activeTool === "draw" || activeTool === "eraser")
    ) {
      const point = stage.getPointerPosition();
      if (!point) return;

      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Continue drawing regardless of canvas boundaries
      const currentLine = store.lineNodes.find(
        (line) => line.id === currentLineId,
      );
      if (currentLine) {
        const updatedPoints = [
          ...currentLine.points,
          stagePoint.x,
          stagePoint.y,
        ];
        store.updateLineNode(currentLineId, { points: updatedPoints }, false);
      }
      setLastPoint(stagePoint);
    }

    if (isDrawingShape && currentShapeId && shapeStartPoint) {
      const point = stage.getPointerPosition();
      if (!point) return;

      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      const clamped = clampToLeftPanel(stagePoint);

      const start = shapeStartPoint;

      let dx = clamped.x - start.x;
      let dy = clamped.y - start.y;

      const shiftHeld = (e.evt as MouseEvent).shiftKey;
      const keepSquare = shiftHeld;
      if (keepSquare) {
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        dx = dx < 0 ? -side : side;
        dy = dy < 0 ? -side : side;
      }

      const newX = dx < 0 ? start.x + dx : start.x;
      const newY = dy < 0 ? start.y + dy : start.y;

      const newWidth = Math.abs(dx);
      const newHeight = Math.abs(dy);

      const updateProps = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };

      store.updateNode(currentShapeId, updateProps, false);

      setShapePreview({ x: newX, y: newY, width: newWidth, height: newHeight });
    }

    if (isSelecting && selectionRectRef.current) {
      const point = stage.getPointerPosition();
      if (!point) return;
      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      const clampedPoint = clampToLeftPanel(stagePoint);

      if (selectionRect) {
        selectionRectRef.current.setAttrs({
          x: Math.min(selectionRect.startX, clampedPoint.x),
          y: Math.min(selectionRect.startY, clampedPoint.y),
          width: Math.abs(clampedPoint.x - selectionRect.startX),
          height: Math.abs(clampedPoint.y - selectionRect.startY),
        });
      }

      setSelectionRect((prev) =>
        prev
          ? {
              ...prev,
              endX: clampedPoint.x,
              endY: clampedPoint.y,
            }
          : null,
      );
    }
  };

  const handleStageMouseUp = () => {
    if (isDrawing) {
      store.saveState();
    }

    if (isDrawingShape && currentShapeId) {
      store.saveState();
      store.setActiveTool("select");
      store.selectNode(currentShapeId);
    }

    if (isSelecting && selectionRect) {
      const left = Math.min(selectionRect.startX, selectionRect.endX);
      const right = Math.max(selectionRect.startX, selectionRect.endX);
      const top = Math.min(selectionRect.startY, selectionRect.endY);
      const bottom = Math.max(selectionRect.startY, selectionRect.endY);

      const selectedIds: string[] = [];

      nodes.forEach((node) => {
        if (
          node.x + node.width >= left &&
          node.x <= right &&
          node.y + node.height >= top &&
          node.y <= bottom
        ) {
          selectedIds.push(node.id);
        }
      });

      store.lineNodes.forEach((node) => {
        const isInSelection = node.points.some((point, index) => {
          if (index % 2 === 0) {
            const x = point;
            const y = node.points[index + 1];
            return x >= left && x <= right && y >= top && y <= bottom;
          }
          return false;
        });

        if (isInSelection) {
          selectedIds.push(node.id);
        }
      });

      if (selectedIds.length > 0) {
        store.selectNode(selectedIds[0], true);
        selectedIds.slice(1).forEach((id) => {
          store.selectNode(id, true);
        });
      }
    }

    setIsDragging(false);
    setIsDrawing(false);
    setCurrentLineId(null);
    setIsSelecting(false);
    isSelectingRef.current = false;
    onSelectionChange?.(false);
    setSelectionRect(null);
    setLastPoint(null);
    setIsDrawingShape(false);
    setCurrentShapeId(null);
    setShapeStartPoint(null);
    setShapePreview(null);
  };

  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(
    null,
  );
  const [isPinching, setIsPinching] = useState(false);

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2),
    );
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  const handleStageWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const isPinchGesture = e.evt.ctrlKey;
    const deltaY = e.evt.deltaY;
    const absDelta = Math.abs(deltaY);

    const isMac = navigator.userAgent.includes("Mac");

    const isMacTrackpadScroll =
      isMac && !isPinchGesture && e.evt.deltaMode === 0 && absDelta <= 10;

    let zoomFactor;

    if (isPinchGesture) {
      const pinchSensitivity = 0.2;
      zoomFactor = 1 + deltaY * pinchSensitivity * -0.01;
    } else if (isMacTrackpadScroll) {
      return;
    } else {
      const mouseSensitivity = 0.0005;
      zoomFactor = Math.exp(-deltaY * mouseSensitivity);
    }

    const newScale = Math.max(0.1, Math.min(10, oldScale * zoomFactor));

    if (newScale !== oldScale) {
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.scale({ x: newScale, y: newScale });
      stage.position(newPos);
    }
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 2) {
      setIsPinching(true);
      setLastPinchDistance(getTouchDistance(touches));
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length === 2 && isPinching && lastPinchDistance) {
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      const currentDistance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      if (!center) return;

      const oldScale = stage.scaleX();
      const scaleChange = currentDistance / lastPinchDistance;

      const newScale = Math.max(0.1, Math.min(10, oldScale * scaleChange));

      if (newScale !== oldScale) {
        const stageCenter = {
          x: (center.x - stage.x()) / oldScale,
          y: (center.y - stage.y()) / oldScale,
        };

        const newPos = {
          x: center.x - stageCenter.x * newScale,
          y: center.y - stageCenter.y * newScale,
        };

        stage.scale({ x: newScale, y: newScale });
        stage.position(newPos);
      }

      setLastPinchDistance(currentDistance);
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    const touches = e.evt.touches;
    if (touches.length < 2) {
      setIsPinching(false);
      setLastPinchDistance(null);
    }
  };

  const handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (e.target === e.target.getStage()) {
      store.selectNode(null);
    }
  };

  const handleNodeMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === "select") {
      const container = e.target.getStage()?.container();
      if (container) container.style.cursor = "move";
    }
  };

  const handleNodeMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (!container) return;
    const defaultCursor =
      activeTool === "draw" || activeTool === "eraser"
        ? "none"
        : activeTool === "select"
          ? "grab"
          : "default";
    container.style.cursor = defaultCursor;
  };

  const handleStageMouseEnter = () => {
    const stage = stageRef.current;
    if (!stage) {
      console.error("Stage reference is not available");
      return;
    }

    if (activeTool === "draw" || activeTool === "eraser") {
      stage.container().style.cursor = "none";
      const pointer = stage.getPointerPosition();
      if (pointer) {
        store.setCursorPosition(pointer);
        store.setCursorVisible(true);
      }
    } else {
      stage.container().style.cursor = "default";
      store.setCursorVisible(false);
    }
  };

  const handleStageMouseLeave = () => {
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = "default";
    }
    store.setCursorVisible(false);
    store.setCursorPosition(null);
  };

  useLayoutEffect(() => {
    const cursorNode = cursorShapeRef.current;
    const cursorLayer = cursorLayerRef.current;
    const stage = stageRef.current;
    if (!cursorNode || !cursorLayer || !stage) return;

    if (
      store.cursorVisible &&
      store.cursorPosition &&
      (activeTool === "draw" || activeTool === "eraser")
    ) {
      const stageX = stage.x();
      const stageY = stage.y();
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();

      cursorLayer.x(-stageX / scaleX);
      cursorLayer.y(-stageY / scaleY);
      cursorLayer.scaleX(1 / scaleX);
      cursorLayer.scaleY(1 / scaleY);

      cursorNode.visible(true);
      cursorNode.position(store.cursorPosition);
      cursorNode.radius(brushSize / 2);

      if (activeTool === "draw") {
        cursorNode.fill(brushColor);
        cursorNode.stroke("rgba(255, 255, 255, 0.7)");
        cursorNode.strokeWidth(1);
      } else {
        cursorNode.fill("rgba(255, 255, 255, 0.3)");
        cursorNode.stroke("rgba(0, 0, 0, 0.7)");
        cursorNode.strokeWidth(1);
      }
    } else {
      cursorNode.visible(false);
    }
    cursorLayer.batchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    store.cursorVisible,
    store.cursorPosition,
    activeTool,
    brushColor,
    brushSize,
  ]);

  const renderNode = (node: Node | LineNode) => {
    const handleNodeMouseDown = (
      e: Konva.KonvaEventObject<MouseEvent>,
      nodeId: string,
    ) => {
      if (
        activeTool === "draw" ||
        activeTool === "eraser" ||
        activeTool === "shape"
      ) {
        return;
      }

      if ("button" in e.evt && (e.evt as MouseEvent).button === 2) {
        const node = store.nodes.find((n) => n.id === nodeId);
        const lineNode = store.lineNodes.find((n) => n.id === nodeId);
        const isLocked = (node?.locked || lineNode?.locked) ?? false;

        if (isLocked) {
          store.selectNode(nodeId);
          return;
        }
      }

      const draggedNode =
        (nodes.find((n) => n.id === nodeId) as Node | LineNode | undefined) ||
        store.lineNodes.find((ln) => ln.id === nodeId);
      if (draggedNode?.locked) {
        return;
      }

      const isMultiSelect =
        (e.evt as MouseEvent).ctrlKey || (e.evt as MouseEvent).metaKey;

      if (e.target === e.target.getStage()) {
        store.selectNode(null);
        return;
      }

      store.selectNode(nodeId, isMultiSelect);
    };

    const handleNodeDragStart = (
      e: Konva.KonvaEventObject<DragEvent>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };
      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      let newX = targetNode.x();
      let newY = targetNode.y();
      const draggedNode =
        (nodes.find((n) => n.id === nodeId) as Node | LineNode | undefined) ||
        store.lineNodes.find((ln) => ln.id === nodeId);
      if (draggedNode && draggedNode.type === "circle") {
        newX = targetNode.x() - draggedNode.width / 2;
        newY = targetNode.y() - draggedNode.height / 2;
      }
      store.moveNode(nodeId, newX, newY, 0, 0, false);
    };

    const handleNodeDragMove = (
      e: Konva.KonvaEventObject<DragEvent>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };

      const dx = targetNode.x() - (targetNode.lastX || targetNode.x());
      const dy = targetNode.y() - (targetNode.lastY || targetNode.y());

      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      let newXMove = targetNode.x();
      let newYMove = targetNode.y();
      const movingNode =
        (nodes.find((n) => n.id === nodeId) as Node | LineNode | undefined) ||
        store.lineNodes.find((ln) => ln.id === nodeId);
      if (movingNode && movingNode.type === "circle") {
        newXMove = targetNode.x() - movingNode.width / 2;
        newYMove = targetNode.y() - movingNode.height / 2;
      }
      store.moveNode(nodeId, newXMove, newYMove, dx, dy, false);
    };

    const handleNodeDragEnd = (
      e: Konva.KonvaEventObject<DragEvent>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };
      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      let endX = targetNode.x();
      let endY = targetNode.y();
      const endNode =
        (nodes.find((n) => n.id === nodeId) as Node | LineNode | undefined) ||
        store.lineNodes.find((ln) => ln.id === nodeId);
      if (endNode && endNode.type === "circle") {
        endX = targetNode.x() - endNode.width / 2;
        endY = targetNode.y() - endNode.height / 2;
      }
      store.moveNode(nodeId, endX, endY, 0, 0, true);
    };

    const isSelected = selectedNodeIds.includes(node.id);
    const listeningEnabled = activeTool !== "shape";

    if (node.type === "line") {
      const lineNode = node as LineNode;

      const handleLineDragStart = (
        e: Konva.KonvaEventObject<DragEvent>,
        _nodeId: string,
      ) => {
        void _nodeId;
        const targetNode = e.target as Konva.Node & {
          lastX?: number;
          lastY?: number;
        };
        targetNode.lastX = targetNode.x();
        targetNode.lastY = targetNode.y();
      };
      const handleLineDragMove = (
        e: Konva.KonvaEventObject<DragEvent>,
        _nodeId: string,
      ) => {
        void _nodeId;
        const targetNode = e.target as Konva.Node & {
          lastX?: number;
          lastY?: number;
        };
        targetNode.lastX = targetNode.x();
        targetNode.lastY = targetNode.y();
      };
      const handleLineDragEnd = (
        e: Konva.KonvaEventObject<DragEvent>,
        nodeId: string,
      ) => {
        const targetNode = e.target as Konva.Node;
        const finalX = targetNode.x();
        const finalY = targetNode.y();
        const finalOffsetX = targetNode.offsetX();
        const finalOffsetY = targetNode.offsetY();

        store.updateLineNode(
          nodeId,
          {
            x: finalX,
            y: finalY,
            offsetX: finalOffsetX,
            offsetY: finalOffsetY,
          },
          true,
        );
      };

      return (
        <Line
          key={lineNode.id}
          id={lineNode.id}
          points={lineNode.points}
          stroke={lineNode.stroke}
          opacity={lineNode.opacity ?? 1}
          strokeWidth={
            isSelected ? (lineNode.strokeWidth || 0) + 2 : lineNode.strokeWidth
          }
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          onMouseDown={(e) => handleNodeMouseDown(e, lineNode.id)}
          onTap={(e) =>
            handleNodeMouseDown(
              e as Konva.KonvaEventObject<MouseEvent>,
              lineNode.id,
            )
          }
          onMouseEnter={handleNodeMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
          draggable={draggableIfToolsNotActive(
            activeTool,
            lineNode.draggable && lineNode.locked == false,
          )}
          onDragMove={(e) => handleLineDragMove(e, lineNode.id)}
          onDragStart={(e) => handleLineDragStart(e, lineNode.id)}
          onDragEnd={(e) => handleLineDragEnd(e, lineNode.id)}
          x={lineNode.x || 0}
          y={lineNode.y || 0}
          scaleX={lineNode.scaleX || 1}
          scaleY={lineNode.scaleY || 1}
          rotation={lineNode.rotation || 0}
          offsetX={lineNode.offsetX || 0}
          offsetY={lineNode.offsetY || 0}
          zIndex={lineNode.zIndex}
          listening={listeningEnabled}
        />
      );
    }

    if (node.type === "circle") {
      return (
        <Ellipse
          key={node.id}
          id={node.id}
          x={node.x + node.width / 2}
          y={node.y + node.height / 2}
          radiusX={node.width / 2}
          radiusY={node.height / 2}
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={0}
          rotation={node.rotation || 0}
          scaleX={node.scaleX || 1}
          scaleY={node.scaleY || 1}
          offsetX={node.offsetX || 0}
          offsetY={node.offsetY || 0}
          zIndex={node.zIndex}
          draggable={draggableIfToolsNotActive(
            activeTool,
            node.draggable && node.locked == false,
          )}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onTap={(e) =>
            handleNodeMouseDown(
              e as Konva.KonvaEventObject<MouseEvent>,
              node.id,
            )
          }
          onMouseEnter={handleNodeMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
          onDragMove={(e) => handleNodeDragMove(e, node.id)}
          onDragStart={(e) => handleNodeDragStart(e, node.id)}
          onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          listening={listeningEnabled}
        />
      );
    }

    if (node.type === "rectangle") {
      return (
        <Rect
          key={node.id}
          id={node.id}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={0}
          rotation={node.rotation || 0}
          scaleX={node.scaleX || 1}
          scaleY={node.scaleY || 1}
          offsetX={node.offsetX || 0}
          offsetY={node.offsetY || 0}
          zIndex={node.zIndex}
          draggable={draggableIfToolsNotActive(
            activeTool,
            node.draggable && node.locked == false,
          )}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onTap={(e) =>
            handleNodeMouseDown(
              e as Konva.KonvaEventObject<MouseEvent>,
              node.id,
            )
          }
          onMouseEnter={handleNodeMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
          onDragMove={(e) => handleNodeDragMove(e, node.id)}
          onDragStart={(e) => handleNodeDragStart(e, node.id)}
          onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          listening={listeningEnabled}
        />
      );
    }

    if (node.type === "triangle") {
      const radius = Math.max(node.width, node.height) / 2;

      return (
        <RegularPolygon
          key={node.id}
          id={node.id}
          x={node.x + node.width / 2}
          y={node.y + node.height / 2}
          sides={3}
          radius={radius}
          fill={node.fill}
          stroke={node.stroke}
          strokeWidth={0}
          rotation={node.rotation || 0}
          scaleX={node.scaleX || 1}
          scaleY={node.scaleY || 1}
          offsetX={node.offsetX || 0}
          offsetY={node.offsetY || 0}
          zIndex={node.zIndex}
          draggable={draggableIfToolsNotActive(
            activeTool,
            node.draggable && node.locked == false,
          )}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onTap={(e) =>
            handleNodeMouseDown(
              e as Konva.KonvaEventObject<MouseEvent>,
              node.id,
            )
          }
          onMouseEnter={handleNodeMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
          onDragMove={(e) => handleNodeDragMove(e, node.id)}
          onDragStart={(e) => handleNodeDragStart(e, node.id)}
          onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          listening={listeningEnabled}
        />
      );
    }

    if (node.type === "image") {
      return (
        <React.Fragment key={node.id}>
          {node.backgroundColor && node.backgroundColor !== "transparent" && (
            <Rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              fill={node.backgroundColor}
              stroke={node.stroke}
              strokeWidth={node.strokeWidth}
              rotation={node.rotation || 0}
              scaleX={node.scaleX || 1}
              scaleY={node.scaleY || 1}
              offsetX={node.offsetX || 0}
              offsetY={node.offsetY || 0}
              listening={false}
              zIndex={node.zIndex}
            />
          )}
          <Image
            id={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            image={node.imageElement || undefined}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            offsetX={node.offsetX || 0}
            offsetY={node.offsetY || 0}
            draggable={draggableIfToolsNotActive(
              activeTool,
              node.draggable && node.locked == false,
            )}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) =>
              handleNodeMouseDown(
                e as Konva.KonvaEventObject<MouseEvent>,
                node.id,
              )
            }
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
            listening={listeningEnabled}
          />
        </React.Fragment>
      );
    }

    return null;
  };

  // Separate function to render transformers on their own layer
  const renderTransformers = () => {
    return [...nodes, ...store.lineNodes].map((node) => {
      const isSelected = selectedNodeIds.includes(node.id);
      if (!isSelected) return null;

      return (
        <Transformer
          key={`transformer-${node.id}`}
          ref={(ref: Konva.Transformer | null) => {
            if (ref) {
              transformerRefs.current[node.id] = ref;
            }
          }}
          boundBoxFunc={(oldBox, newBox) => {
            const minSize = 5;

            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={[
            "top-left",
            "top-center",
            "top-right",
            "middle-right",
            "middle-left",
            "bottom-left",
            "bottom-center",
            "bottom-right",
          ]}
          rotateEnabled={true}
          keepRatio={true}
          centeredScaling={true}
          padding={5}
          shiftBehavior="inverted"
          ignoreStroke={true}
          onTransformEnd={(e: Konva.KonvaEventObject<Event>) => {
            const konvaNode = e.target;
            const nodeId = konvaNode.id();

            const finalRotation = konvaNode.rotation();
            const finalScaleX = konvaNode.scaleX();
            const finalScaleY = konvaNode.scaleY();
            const finalX = konvaNode.x();
            const finalY = konvaNode.y();
            const finalOffsetX = konvaNode.offsetX();
            const finalOffsetY = konvaNode.offsetY();

            const isLineNode = store.lineNodes.find((ln) => ln.id === nodeId);

            if (isLineNode) {
              store.updateLineNode(
                nodeId,
                {
                  x: finalX,
                  y: finalY,
                  rotation: finalRotation,
                  scaleX: finalScaleX,
                  scaleY: finalScaleY,
                  offsetX: finalOffsetX,
                  offsetY: finalOffsetY,
                },
                true,
              );
            } else {
              store.updateNode(
                nodeId,
                {
                  x: finalX,
                  y: finalY,
                  rotation: finalRotation,
                  scaleX: finalScaleX,
                  scaleY: finalScaleY,
                  offsetX: finalOffsetX,
                  offsetY: finalOffsetY,
                },
                true,
              );
            }
          }}
        />
      );
    });
  };

  useEffect(() => {
    if (!stageRef.current) return;
    Object.entries(transformerRefs.current).forEach(([nodeId, transformer]) => {
      if (!transformer) return;

      const isSelected = selectedNodeIds.includes(nodeId);
      transformer.visible(isSelected);

      if (isSelected) {
        const node = stageRef.current!.findOne(`#${nodeId}`);
        if (node) {
          transformer.nodes([node]);
          transformer.getLayer()?.batchDraw();
        }
      }
    });

    if (multiSelectTransformerRef.current && selectedNodeIds.length > 1) {
      const nodesToTransform = selectedNodeIds
        .map((id) => stageRef.current!.findOne<Konva.Node>(`#${id}`))
        .filter((n): n is Konva.Node => Boolean(n));
      if (nodesToTransform.length > 0) {
        multiSelectTransformerRef.current.nodes(nodesToTransform);
        multiSelectTransformerRef.current.getLayer()?.batchDraw();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeIds]);

  return (
    <SplitPane
      singlePaneMode={singlePaneMode}
      initialPercent={singlePaneMode ? 100 : 50}
      onChange={setLeftPct}
      left={
        <div
          ref={containerRef}
          className="flex h-full w-full items-center justify-center overflow-hidden"
        >
          <Stage
            ref={stageRef}
            width={containerDimensions.width * (leftPct / 100)}
            height={containerDimensions.height}
            scaleX={1}
            scaleY={1}
            style={{
              background: "transparent",
            }}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleStageWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onClick={handleStageClick}
            onMouseEnter={handleStageMouseEnter}
            onMouseLeave={handleStageMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Layer
              ref={leftPanelRef}
              clipFunc={(ctx) => {
                ctx.rect(
                  0,
                  0,
                  store.getAspectRatioDimensions().width,
                  store.getAspectRatioDimensions().height,
                );
              }}
            >
              <Rect
                x={0}
                y={0}
                width={store.getAspectRatioDimensions().width}
                height={store.getAspectRatioDimensions().height}
                fill={fillColor}
                listening={false}
                zIndex={-1}
              />

              {[...nodes, ...store.lineNodes]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((node) => renderNode(node))}

              {selectionRect && (
                <Rect
                  ref={selectionRectRef}
                  x={Math.min(selectionRect.startX, selectionRect.endX)}
                  y={Math.min(selectionRect.startY, selectionRect.endY)}
                  width={Math.abs(selectionRect.endX - selectionRect.startX)}
                  height={Math.abs(selectionRect.endY - selectionRect.startY)}
                  fill="rgba(0, 161, 255, 0.1)"
                  stroke="rgb(0, 161, 255)"
                  strokeWidth={1}
                  listening={false}
                  cornerRadius={2}
                />
              )}

              {shapePreview && (
                <Rect
                  x={shapePreview.x}
                  y={shapePreview.y}
                  width={shapePreview.width}
                  height={shapePreview.height}
                  stroke="#3b82f6"
                  dash={[4, 4]}
                  strokeWidth={1}
                  listening={false}
                />
              )}
            </Layer>
            <Layer ref={cursorLayerRef} listening={false} draggable={false}>
              <Circle ref={cursorShapeRef} visible={false} />
            </Layer>
            {/* Separate layer for transformers - no clipping so they remain visible when nodes extend beyond canvas */}
            <Layer listening={true} zIndex={1000}>
              {renderTransformers()}
            </Layer>
          </Stage>
        </div>
      }
      right={
        <div
          ref={rightContainerRef}
          className="flex h-full w-full items-center justify-center overflow-hidden p-4"
        >
          <Stage
            width={NATURAL_WIDTH * previewScale}
            height={NATURAL_HEIGHT * previewScale}
            scaleX={previewScale}
            scaleY={previewScale}
            x={0}
            y={0}
          >
            <Layer>
              <Image
                ref={imageRef}
                image={undefined}
                fill="white"
                listening={false}
                zIndex={-1}
              />
            </Layer>
          </Stage>
        </div>
      }
    />
  );
};
