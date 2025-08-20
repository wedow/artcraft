import { useState, useRef, useEffect } from "react";
import Konva from "konva"; // just for types
import {
  EnqueueImageInpaint,
  EnqueueImageInpaintModel,
} from "@storyteller/tauri-api";
import { ContextMenuContainer } from "../PageDraw/components/ui/ContextMenu";
import { useCopyPasteHotkeys } from "../PageDraw/hooks/useCopyPasteHotkeys";
import { useDeleteHotkeys } from "../PageDraw/hooks/useDeleteHotkeys";
import { useUndoRedoHotkeys } from "../PageDraw/hooks/useUndoRedoHotkeys";
import PromptEditor from "./PromptEditor/PromptEditor";
import { ActiveEditTool, useEditStore } from "./stores/EditState";
import { EditPaintSurface } from "./EditPaintSurface";
import { normalizeCanvas } from "../../Helpers/CanvasHelpers";
import { BaseImageSelector, BaseSelectorImage } from "./BaseImageSelector";
import DrawToolControlBar from "./DrawToolControlBar";
import { IMAGE_EDITOR_PAGE_MODEL_LIST, ModelPage, ModelSelector, useModelSelectorStore } from "@storyteller/ui-model-selector";
import { ModelInfo } from "@storyteller/model-list";

const PAGE_ID : ModelPage = ModelPage.ImageEditor;

const PageEdit = () => {
  //useStateSceneLoader();
  const { selectedModels } = useModelSelectorStore();

  const selectedModel =
    selectedModels[PAGE_ID] ||
    IMAGE_EDITOR_PAGE_MODEL_LIST[0]?.label;

  const selectedModelInfo: ModelInfo | undefined =
    IMAGE_EDITOR_PAGE_MODEL_LIST.find(
      (m) => m.label === selectedModel,
    )?.modelInfo;

  // State for canvas dimensions
  const canvasWidth = useRef<number>(1024);
  const canvasHeight = useRef<number>(1024);

  // Add new state to track if user is selecting
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  // Create refs for stage and image
  const stageRef = useRef<Konva.Stage>({} as Konva.Stage);
  const leftPanelRef = useRef<Konva.Layer>({} as Konva.Layer);
  const baseImageKonvaRef = useRef<Konva.Image>({} as Konva.Image);
  const transformerRefs = useRef<{ [key: string]: Konva.Transformer }>({});
  const [isEnqueuing, setIsEnqueuing] = useState<boolean>(false);
  const [generationCount, setGenerationCount] = useState<number>(1);


  // Use the Zustand store
  const store = useEditStore();

  // Pass store actions directly as callbacks
  useDeleteHotkeys({ onDelete: store.deleteSelectedItems });
  useUndoRedoHotkeys({ undo: store.undo, redo: store.redo });
  useCopyPasteHotkeys({
    onCopy: store.copySelectedItems,
    onPaste: store.pasteItems,
  });

  // Listen for gallery drag and drop events
  useEffect(() => {
    const handleGallery2DDrop = (event: CustomEvent) => {
      const { item, canvasPosition } = event.detail;
      console.log("Received 2D gallery drop:", { item, canvasPosition });

      // Get the stage to transform coordinates properly
      const stage = stageRef.current;
      if (!stage) {
        console.error(
          "Stage reference not available for coordinate transformation",
        );
        return;
      }

      // Transform canvas coordinates to stage coordinates
      // Account for stage position, scale, and transformations
      const stageX = stage.x();
      const stageY = stage.y();
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();

      const stagePoint = {
        x: (canvasPosition.x - stageX) / scaleX,
        y: (canvasPosition.y - stageY) / scaleY,
      };

      console.log("Transformed stage coordinates:", stagePoint);

      // Use the direct URL for the image
      const imageUrl = item.fullImage || item.thumbnail;
      if (!imageUrl) {
        console.error("No image URL available for dropped item");
        return;
      }

      console.log("Creating image from URL:", imageUrl);

      // Use the store's createImageFromUrl method directly
      store.createImageFromUrl(stagePoint.x, stagePoint.y, imageUrl);

      console.log(
        `Created image "${item.label}" at stage position:`,
        stagePoint,
      );
    };

    // Add event listener
    window.addEventListener(
      "gallery-2d-drop",
      handleGallery2DDrop as EventListener,
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        "gallery-2d-drop",
        handleGallery2DDrop as EventListener,
      );
    };
  }, [store]);

  const onFitPressed = async () => {
    // Get the stage and its container dimensions
    const stage = stageRef.current;

    // Get container dimensions
    const containerWidth = stage.container().offsetWidth;
    const containerHeight = stage.container().offsetHeight;

    // Get canvas dimensions from store aspect ratio
    const canvasW = store.getAspectRatioDimensions().width;
    const canvasH = store.getAspectRatioDimensions().height;

    // Calculate position to center canvas in container
    stage.position({
      x: (containerWidth - canvasW) / 2,
      y: (containerHeight - canvasH) / 2,
    });
  };

  // Create a function to use the left layer ref and download the bitmap from it
  const getMaskArrayBuffer = async (): Promise<Uint8Array> => {
    if (
      !stageRef.current ||
      !leftPanelRef.current ||
      !baseImageKonvaRef.current
    ) {
      console.error("Stage or left panel ref is not available");
      throw new Error("Stage or left panel or base image ref is not available");
    }

    const layer = leftPanelRef.current;

    // Get the canvas area that's covered by the image/rectangle
    const rect = baseImageKonvaRef.current;
    const layerCrop = layer.toCanvas({
      x: stageRef.current.x(),
      y: stageRef.current.y(),
      width: rect.width() * stageRef.current.scaleX(),
      height: rect.height() * stageRef.current.scaleY(),
      pixelRatio: 1 / stageRef.current.scaleX(),
    });

    // Using the pixelRatio scaling may result in off-by-one rounding errors,
    // So we re-fit the image to a canvas of precise size.
    const fittedCanvas = normalizeCanvas(
      layerCrop,
      rect.width(),
      rect.height(),
    );

    const blob = await fittedCanvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await blob.arrayBuffer();

    return new Uint8Array(arrayBuffer);
  };

  const handleGenerate = async (prompt: string) => {
    if (isEnqueuing) {
      console.warn("Already enqueuing an image, please wait.");
      return;
    }

    setIsEnqueuing(true);

    const editedImageToken = store.baseImageInfo?.mediaToken;

    if (!editedImageToken) {
      console.error("Base image is not available");
      return;
    }

    // TODO: Call inference API here
    const arrayBuffer = await getMaskArrayBuffer();

    await EnqueueImageInpaint({
      model: selectedModelInfo,
      image_media_token: editedImageToken,
      mask_image_raw_bytes: arrayBuffer,
      prompt: prompt,
      image_count: generationCount,
    });

    setIsEnqueuing(false);
  };

  // Display image selector on launch, otherwise hide it
  // Also show loading state if info is set but image is loading
  if (!store.baseImageInfo || !store.baseImageBitmap) {
    return (
      <div
        className={
          "flex h-screen w-full items-center justify-center bg-ui-panel"
        }
      >
        <BaseImageSelector
          onImageSelect={(image: BaseSelectorImage) => {
            store.setBaseImageInfo(image);
          }}
          showLoading={
            store.baseImageInfo !== null && store.baseImageInfo === null
          }
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={`preserve-aspect-ratio fixed left-1/2 top-0 z-10 -translate-x-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{ display: store.activeTool === "edit" ? "block" : "none" }}
      >
        <DrawToolControlBar
          currentMode={store.editOperation}
          currentSize={store.brushSize}
          onModeChange={store.setEditOperation}
          onSizeChange={store.setBrushSize}
        />
      </div>
      <div
        className={`preserve-aspect-ratio fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <PromptEditor
          modelInfo={selectedModelInfo}
          onModeChange={(mode: string) => {
            store.setActiveTool(mode as ActiveEditTool);
          }}
          selectedMode={store.activeTool}
          onGenerateClick={handleGenerate}
          isDisabled={isEnqueuing}
          generationCount={generationCount}
          onGenerationCountChange={setGenerationCount}
        />
      </div>
      <div className="relative z-0">
        <ContextMenuContainer
          onAction={(e, action) => {
            if (action === "contextMenu") {
              const hasSelection = store.selectedNodeIds.length > 0;
              if (hasSelection) {
                console.log("An item is selected.");
                // You can add additional actions here based on the selection
                return true;
              } else {
                console.log("No item is selected.");
                return false;
              }
            }
            return false;
          }}
          onMenuAction={async (action) => {
            switch (action) {
              case "DUPLICATE":
                store.copySelectedItems();
                store.pasteItems();
                break;
              case "DELETE":
                store.deleteSelectedItems();
                break;
              default:
              // No action needed for unhandled cases
            }
          }}
          isLocked={store.selectedNodeIds.some((id) => {
            const node = store.nodes.find((n) => n.id === id);
            const lineNode = store.lineNodes.find((n) => n.id === id);
            return (node?.locked || lineNode?.locked) ?? false;
          })}
        >
          <EditPaintSurface
            nodes={store.nodes}
            selectedNodeIds={store.selectedNodeIds}
            onCanvasSizeChange={(width: number, height: number): void => {
              canvasWidth.current = width;
              canvasHeight.current = height;
            }}
            fillColor={store.fillColor}
            activeTool={store.activeTool}
            brushColor={store.brushColor}
            brushSize={store.brushSize}
            onSelectionChange={setIsSelecting}
            stageRef={stageRef}
            transformerRefs={transformerRefs}
            leftPanelRef={leftPanelRef}
            baseImageRef={baseImageKonvaRef}
          />
        </ContextMenuContainer>
      </div>
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
        <ModelSelector
          items={IMAGE_EDITOR_PAGE_MODEL_LIST}
          page={PAGE_ID}
          panelTitle="Select Model"
          panelClassName="min-w-[280px]"
          buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
          showIconsInList
          triggerLabel="Model"
        />
        <button
          className="rounded bg-transparent p-2 text-lg text-white transition hover:bg-white/20 hover:text-white"
          onClick={onFitPressed}
        >
          Fit
        </button>
      </div>
    </>
  );
};

export default PageEdit;
