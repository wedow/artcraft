import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Line,
  Image,
  RegularPolygon,
  Transformer,
} from "react-konva";
import Konva from "konva"; // Import Konva namespace for types

import { LineNode } from "./stores/SceneState";
import { Node, NodeType } from "./Node";
import { useStageSnapshot } from "./hooks/useUpdateSnapshot";
// https://github.com/SaladTechnologies/comfyui-api
import "./App.css";
import SplitPane from "./components/ui/SplitPane";

import { useSceneStore } from "./stores/SceneState";
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
  const store = useSceneStore(); // Use store directly
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [snapshotImage, setSnapshotImage] = useState<HTMLImageElement | null>(
    null,
  );
  const leftPanelRef = React.useRef<Konva.Layer>(null);
  const rightContainerRef = React.useRef<HTMLDivElement>(null);
  const cursorLayerRef = React.useRef<Konva.Layer>(null);
  const cursorShapeRef = React.useRef<Konva.Circle>(null);

  // Layout 683 by 1024
  const [leftPanelWidth, setLeftPanelWidth] = useState(1024);
  const [leftPanelHeight, setLeftPanelHeight] = useState(1024);
  const [rightPanelWidth, setRightPanelWidth] = useState(1024);
  const [rightPanelHeight, setRightPanelHeight] = useState(1024);

  /* 1️⃣ Track SplitPane percent so we can re-measure */
  const [leftPct, setLeftPct] = useState(50);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  const selectionRectRef = React.useRef<Konva.Rect>(null);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Add a ref to track if we're currently selecting
  const isSelectingRef = React.useRef(false);

  // Add state to track the current line being drawn
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);
  const stagePosition = useStageCentering(
    stageRef,
    leftPct,
    leftPanelWidth,
    leftPanelHeight,
  );

  const NATURAL_WIDTH = rightPanelWidth;
  const NATURAL_HEIGHT = rightPanelHeight;

  // transform variables
  const multiSelectTransformerRef = React.useRef<Konva.Transformer>(null);

  // better to double buffer and use a queue and submit to a queue
  // useStageSnapshot(
  //   stageRef,
  //   imageRef,
  //   isSelectingRef,
  //   transformerRefs
  // );
  
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
      x: Math.max(0, Math.min(point.x, leftPanelWidth)),
      y: Math.max(0, Math.min(point.y, leftPanelHeight)),
    };
  };

  const isWithinLeftPanel = (point: { x: number; y: number }): boolean => {
    return (
      point.x >= 0 &&
      point.x <= leftPanelWidth &&
      point.y >= 0 &&
      point.y <= leftPanelHeight
    );
  };

  // Helper function to determine if nodes should be draggable
  const draggableIfToolsNotActive = (
    activeTool: string,
    nodeDraggable: boolean,
  ): boolean => {
    return activeTool !== "draw" && activeTool !== "eraser" && nodeDraggable;
  };

  // Combined mouse handlers
  const handleStageMouseDown = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;

    const stagePoint = {
      x: (point.x - stage.x()) / stage.scaleX(),
      y: (point.y - stage.y()) / stage.scaleY(),
    };

    // Only set isDragging if the point is outside the panel bounds first mouse button
    if (!isWithinLeftPanel(stagePoint)) {
      setIsDragging(true);
      return;
    }

    // Dragging and panning the stage given the middle mouse.
    if (e.evt.button === 1 || e.evt.button === 2) {
      setIsDragging(true);
      return;
    }

    // Handle drawing tools - only start if within bounds
    if (
      (activeTool === "draw" || activeTool === "eraser") &&
      isWithinLeftPanel(stagePoint)
    ) {
      const lineId = `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      let opacity;

      if (activeTool === "draw") {
        opacity = store.brushOpacity
      } else {
        opacity = 1
      }

      const newLineNode: LineNode = {
        id: lineId,
        type: "line",
        points: [stagePoint.x, stagePoint.y],
        stroke: activeTool === "draw" ? brushColor : fillColor || "#ffffff",
        strokeWidth: brushSize / stage.scaleX(),
        draggable: true,
        opacity: opacity  // Add opacity to the line node
      };
      store.selectNode(null);
      store.addLineNode(newLineNode);
      setCurrentLineId(lineId);
      setIsDrawing(true);
      setLastPoint(stagePoint);
      return;
    }

    // Handle selection rectangle
    if (activeTool === "select" && e.target === e.target.getStage()) {
      const stage = stageRef.current;
      if (!stage) return;
      const point = stage.getPointerPosition();
      if (!point) return;

      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Clamp the starting point to left panel bounds
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
  };

  const handleStageMouseMove = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Update cursor position for draw/eraser tools
    if (activeTool === "draw" || activeTool === "eraser") {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        store.setCursorPosition(pointer);
        store.setCursorVisible(true);
      }
    } else {
      store.setCursorVisible(false);
    }

    // Only handle panning if we're actually dragging
    if (isDragging) {
      const currentStage = e.target.getStage();
      if (!currentStage) return;
      const newPos = {
        x: currentStage.x() + e.evt.movementX,
        y: currentStage.y() + e.evt.movementY,
      };
      currentStage.position(newPos);
      return;
    }

    // Handle drawing - only add points if within bounds
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

      // Only add point if it's within the left panel bounds
      if (isWithinLeftPanel(stagePoint)) {
        const currentLine = store.lineNodes.find(
          (line) => line.id === currentLineId,
        );
        if (currentLine) {
          const updatedPoints = [
            ...currentLine.points,
            stagePoint.x,
            stagePoint.y,
          ];
          store.updateLineNode(currentLineId, { points: updatedPoints });
        }
        setLastPoint(stagePoint);
      } else {
        // Stop drawing when going out of bounds
        setIsDrawing(false);
        setCurrentLineId(null);
        setLastPoint(null);
      }
    }

    // Handle selection rectangle - Update directly through Konva
    if (isSelecting && selectionRectRef.current) {
      const point = stage.getPointerPosition();
      if (!point) return;
      const stagePoint = {
        x: (point.x - stage.x()) / stage.scaleX(),
        y: (point.y - stage.y()) / stage.scaleY(),
      };

      // Clamp the current point to left panel bounds
      const clampedPoint = clampToLeftPanel(stagePoint);

      // Update the rectangle directly through Konva without React state
      if (selectionRect) {
        selectionRectRef.current.setAttrs({
          x: Math.min(selectionRect.startX, clampedPoint.x),
          y: Math.min(selectionRect.startY, clampedPoint.y),
          width: Math.abs(clampedPoint.x - selectionRect.startX),
          height: Math.abs(clampedPoint.y - selectionRect.startY),
        });
      }

      // Only update React state for the end points (needed for selection logic)
      setSelectionRect((prev) =>
        prev
          ? {
              // Ensure prev is not null
              ...prev,
              endX: clampedPoint.x,
              endY: clampedPoint.y,
            }
          : null,
      );
    }
  };

  const handleStageMouseUp = () => {
    if (isSelecting && selectionRect) {
      // Calculate the bounds of the selection rectangle
      const left = Math.min(selectionRect.startX, selectionRect.endX);
      const right = Math.max(selectionRect.startX, selectionRect.endX);
      const top = Math.min(selectionRect.startY, selectionRect.endY);
      const bottom = Math.max(selectionRect.startY, selectionRect.endY);

      // Find all nodes that intersect with the selection rectangle
      const selectedIds: string[] = [];

      // Check regular nodes
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

      // Check line nodes
      store.lineNodes.forEach((node) => {
        // Check if any point of the line is within the selection rectangle
        const isInSelection = node.points.some((point, index) => {
          if (index % 2 === 0) {
            // x coordinate
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

      // Select all found nodes
      if (selectedIds.length > 0) {
        store.selectNode(selectedIds[0], true);
        selectedIds.slice(1).forEach((id) => {
          store.selectNode(id, true);
        });
      }
    }

    // Always reset all states
    setIsDragging(false);
    setIsDrawing(false);
    setCurrentLineId(null); // Clear the current line ID
    setIsSelecting(false);
    isSelectingRef.current = false;
    onSelectionChange?.(false);
    setSelectionRect(null);
    setLastPoint(null);
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

    // Calculate new scale
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;

    // Calculate new position
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
  };

  // Add click handler for the stage to clear selection
  const handleStageClick = (
    e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    // Only clear selection if clicking directly on the stage
    if (e.target === e.target.getStage()) {
      store.selectNode(null);
    }
  };

  // End Node Callbacks

  // Add hover handlers
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

  // Add stage hover handlers
  const handleStageMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
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

  const handleStageMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = "default";
    }
    store.setCursorVisible(false);
    store.setCursorPosition(null);
  };

  // Update cursor appearance
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
      // Counteract stage transforms to position cursor in screen space
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
  }, [
    store.cursorVisible,
    store.cursorPosition,
    activeTool,
    brushColor,
    brushSize,
  ]);

  const renderNode = (node: Node | LineNode) => {
    // Node Callbacks
    const handleNodeMouseDown = (
      e: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
      nodeId: string,
    ) => {
      // Don't select nodes when draw or erase tools are active
      if (activeTool === "draw" || activeTool === "eraser") {
        return;
      }

      // Check if Ctrl/Cmd key is pressed
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

      // If clicking directly on the stage, clear selection
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

      store.moveNode(nodeId, targetNode.x(), targetNode.y(), 0, 0, false);
    };

    const handleNodeDragMove = (
      e: Konva.KonvaEventObject<DragEvent>,
      nodeId: string,
    ) => {
      const targetNode = e.target as Konva.Node & {
        lastX?: number;
        lastY?: number;
      };

      // Calculate the movement delta
      const dx = targetNode.x() - (targetNode.lastX || targetNode.x());
      const dy = targetNode.y() - (targetNode.lastY || targetNode.y());

      // Update the last position
      targetNode.lastX = targetNode.x();
      targetNode.lastY = targetNode.y();

      store.moveNode(nodeId, targetNode.x(), targetNode.y(), dx, dy, false);
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

      store.moveNode(nodeId, targetNode.x(), targetNode.y(), 0, 0, true);
    };

    const isSelected = selectedNodeIds.includes(node.id);

    const renderTransformer = () => {
      if (isSelected) {
        return (
          <Transformer
            ref={(ref: Konva.Transformer | null) => {
              // Added type for ref
              if (ref) {
                transformerRefs.current[node.id] = ref;
              }
            }}
            boundBoxFunc={(oldBox, newBox) => {
              const minSize = 5;
              const maxSize = Math.max(leftPanelWidth, leftPanelHeight);

              if (
                newBox.width < minSize ||
                newBox.height < minSize ||
                newBox.width > maxSize ||
                newBox.height > maxSize
              ) {
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
            keepRatio={false}
            centeredScaling={true}
            padding={5}
            ignoreStroke={true}
            onTransformEnd={(e: Konva.KonvaEventObject<Event>) => {
              // Typed event
              const konvaNode = e.target;
              const nodeId = konvaNode.id();

              // Get all transformation values including anchor points
              const finalRotation = konvaNode.rotation();
              const finalScaleX = konvaNode.scaleX();
              const finalScaleY = konvaNode.scaleY();
              const finalX = konvaNode.x();
              const finalY = konvaNode.y();
              const finalOffsetX = konvaNode.offsetX();
              const finalOffsetY = konvaNode.offsetY();

              const isLineNode = store.lineNodes.find((ln) => ln.id === nodeId);

              // Save all transformation values to the store
              if (isLineNode) {
                store.updateLineNode(nodeId, {
                  x: finalX,
                  y: finalY,
                  rotation: finalRotation,
                  scaleX: finalScaleX,
                  scaleY: finalScaleY,
                  offsetX: finalOffsetX,
                  offsetY: finalOffsetY,
                });
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
                ); // Assuming shouldSaveState is true for regular nodes
              }
            }}
          />
        );
      }
      return null;
    };

    if (node.type === "line") {
      const lineNode = node as LineNode;

      const handleLineDragStart = (
        e: Konva.KonvaEventObject<DragEvent>,
        nodeId: string,
      ) => {
        const targetNode = e.target as Konva.Node & {
          lastX?: number;
          lastY?: number;
        };
        targetNode.lastX = targetNode.x();
        targetNode.lastY = targetNode.y();
      };
      const handleLineDragMove = (
        e: Konva.KonvaEventObject<DragEvent>,
        nodeId: string,
      ) => {
        const targetNode = e.target as Konva.Node & {
          lastX?: number;
          lastY?: number;
        };
        targetNode.lastX = targetNode.x(); // This doesn't seem to be used for lines to calculate dx/dy
        targetNode.lastY = targetNode.y(); // but is set for consistency or future use
      };
      const handleLineDragEnd = (
        e: Konva.KonvaEventObject<DragEvent>,
        nodeId: string,
      ) => {
        // Move the line node in the store
        const targetNode = e.target as Konva.Node;
        const finalX = targetNode.x();
        const finalY = targetNode.y();
        const finalOffsetX = targetNode.offsetX(); // Konva might adjust offsetX/Y
        const finalOffsetY = targetNode.offsetY();

        // Update the line node in the store with its final position and transformation
        store.updateLineNode(nodeId, {
          x: finalX,
          y: finalY,
          offsetX: finalOffsetX,
          offsetY: finalOffsetY,
        });
      };

      return (
        <React.Fragment key={lineNode.id}>
          <Line
            id={lineNode.id}
            points={lineNode.points}
            stroke={lineNode.stroke}
            opacity={lineNode.opacity ?? 1}  // Use the line node's opacity or default to 1
            strokeWidth={
              isSelected
                ? (lineNode.strokeWidth || 0) + 2
                : lineNode.strokeWidth
            }
            tension={0.5}
            lineCap="round"
            lineJoin="round"
            onMouseDown={(e) => handleNodeMouseDown(e, lineNode.id)}
            onTap={(e) => handleNodeMouseDown(e, lineNode.id)}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            draggable={draggableIfToolsNotActive(
              activeTool,
              lineNode.draggable,
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
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "circle") {
      return (
        <React.Fragment key={node.id}>
          <Circle
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
            draggable={draggableIfToolsNotActive(activeTool, node.draggable)}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "rectangle") {
      return (
        <React.Fragment key={node.id}>
          <Rect
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
            draggable={draggableIfToolsNotActive(activeTool, node.draggable)}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "triangle") {
      return (
        <React.Fragment key={node.id}>
          <RegularPolygon
            id={node.id}
            x={node.x}
            y={node.y}
            sides={3}
            radius={Math.min(node.width, node.height) / 2}
            fill={node.fill}
            stroke={node.stroke}
            strokeWidth={0}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            offsetX={node.offsetX || 0}
            offsetY={node.offsetY || 0}
            zIndex={node.zIndex}
            draggable={draggableIfToolsNotActive(activeTool, node.draggable)}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    if (node.type === "image") {
      return (
        <React.Fragment key={node.id}>
          {/* Render background rectangle if backgroundColor is set */}
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
            draggable={draggableIfToolsNotActive(activeTool, node.draggable)}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onTap={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={handleNodeMouseEnter}
            onMouseLeave={handleNodeMouseLeave}
            onDragMove={(e) => handleNodeDragMove(e, node.id)}
            onDragStart={(e) => handleNodeDragStart(e, node.id)}
            onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
          />
          {renderTransformer()}
        </React.Fragment>
      );
    }

    return null;
  };

  // TODO refactor this out into zustand? and render the draw ?
  useEffect(() => {
    if (!stageRef.current) return;
    // Update individual transformers
    Object.entries(transformerRefs.current).forEach(([nodeId, transformer]) => {
      if (!transformer) return; // Transformer might be null if ref was cleared

      const isSelected = selectedNodeIds.includes(nodeId);
      transformer.visible(isSelected);

      if (isSelected) {
        const node = stageRef.current!.findOne(`#${nodeId}`); // stageRef.current is checked
        if (node) {
          transformer.nodes([node]);
          transformer.getLayer()?.batchDraw();
        }
      }
    });

    // Update multi-select transformer
    if (multiSelectTransformerRef.current && selectedNodeIds.length > 1) {
      const nodes = selectedNodeIds
        .map((id) => stageRef.current.findOne(`#${id}`))
        .filter(Boolean);
      if (nodes.length > 0) {
        multiSelectTransformerRef.current.nodes(nodes);
        multiSelectTransformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedNodeIds]);

  return (
    <SplitPane
      singlePaneMode={true}
      initialPercent={50}
      onChange={setLeftPct}
      left={
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
          <Stage
            ref={stageRef}
            width={window.innerWidth * (leftPct / 100)}
            height={window.innerHeight}
            scaleX={1} // Initial scale, controlled by wheel/zoom
            scaleY={1} // Initial scale, controlled by wheel/zoom
            style={{
              display: "block",
              background: "transparent", // Or use fillColor if stage background is desired directly
            }}
            x={stagePosition.x} // Set the x position
            y={stagePosition.y} // Set the y position
            onWheel={handleStageWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp} // This global mouse up is likely better from useGlobalMouseUp
            onClick={handleStageClick}
            onMouseEnter={handleStageMouseEnter}
            onMouseLeave={handleStageMouseLeave}
          >
            {/* Left Panel */}
            <Layer
              ref={leftPanelRef}
              clipFunc={(ctx) => {
                ctx.rect(0, 0, leftPanelWidth, leftPanelHeight);
              }}
            >
              <Rect
                x={0}
                y={0}
                width={leftPanelWidth}
                height={leftPanelHeight}
                fill={fillColor}
                listening={false}
                zIndex={-1}
              />

              {/* Render all nodes including line nodes */}
              {[...nodes, ...store.lineNodes]
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((node, index) => {
                // console.log(`Node ${index}:`, node);
                return renderNode(node);
              })}

              {/* Render selection rectangle */}
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
            </Layer>
            <Layer ref={cursorLayerRef} listening={false} draggable={false}>
              <Circle ref={cursorShapeRef} visible={false} />
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
            // style={{
            //   background: '#f5f5f5',
            //   border: '1px solid #ddd',
            //   borderRadius: '8px',
            // }}
          >
            <Layer>
              <Image
                ref={imageRef}
                image={snapshotImage || undefined}
                x={0}
                y={0}
                width={rightPanelWidth}
                height={rightPanelHeight}
                fill="white" //"red"
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
