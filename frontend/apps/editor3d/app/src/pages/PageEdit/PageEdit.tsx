import { useState, useRef, useEffect } from "react";
// https://github.com/SaladTechnologies/comfyui-api

import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faImage } from "@fortawesome/pro-solid-svg-icons";
import Konva from "konva"; // just for types

import { setCanvasRenderBitmap } from "../../signals/canvasRenderBitmap"
import {
  EnqueueImageInpaint,
  EnqueueImageInpaintModel,
} from "@storyteller/tauri-api";
import { ContextMenuContainer } from "../PageDraw/components/ui/ContextMenu";
import SideToolbar from "../PageDraw/components/ui/SideToolbar";
import { useCopyPasteHotkeys } from "../PageDraw/hooks/useCopyPasteHotkeys";
import { useDeleteHotkeys } from "../PageDraw/hooks/useDeleteHotkeys";
import { useUndoRedoHotkeys } from "../PageDraw/hooks/useUndoRedoHotkeys";
import { captureStageImageBitmap } from "../PageDraw/hooks/useUpdateSnapshot";
import PromptEditor from "./PromptEditor/PromptEditor";
import { AspectRatioType } from "../PageDraw/stores/SceneState";
import { ActiveEditTool, useEditStore } from "./stores/EditState";
import { EditPaintSurface } from "./EditPaintSurface";
import { normalizeCanvas } from "~/Helpers/CanvasHelpers";
import { BaseImageSelector, BaseSelectorImage } from "./BaseImageSelector";
import DrawToolControlBar from "./DrawToolControlBar";

const PageEdit = () => {
  //useStateSceneLoader();

  // State for canvas dimensions
  const canvasWidth = useRef<number>(1024);
  const canvasHeight = useRef<number>(1024);
  // Add new state to track if user is selecting
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("GPT-4o");
  // Create refs for stage and image
  const stageRef = useRef<Konva.Stage>({} as Konva.Stage);
  const leftPanelRef = useRef<Konva.Layer>({} as Konva.Layer);
  const rectRef = useRef<Konva.Rect>({} as Konva.Rect);
  const transformerRefs = useRef<{ [key: string]: Konva.Transformer }>({});
  const [baseImage, setBaseImage] = useState<BaseSelectorImage | null>(null);

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

  const handleImageUpload = (files: File[]): void => {
    // Place images at center of viewport with offset for multiple images
    const centerX = 512; // leftPanelWidth / 2
    const centerY = 512; // leftPanelHeight / 2

    console.log("Image upload started with files:", files);
    console.log("Center coordinates:", { centerX, centerY });

    files.forEach((file, index) => {
      console.log(`Processing file ${index}:`, file.name);

      store.createImageFromFile(
        centerX + index * 60, // Offset each image
        centerY + index * 60,
        file,
      );
      console.log(`Created image at position:`, {
        x: centerX + index * 60,
        y: centerY + index * 60,
      });
    });
  };

  const modelList: PopoverItem[] = [
    {
      label: "GPT-4o",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      selected: selectedModel === "GPT-4o",
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "FLUX.1 Kontext",
      icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
      selected: selectedModel === "FLUX.1 Kontext",
      description: "Fast and high-quality model",
      badges: [{ label: "20 sec.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ];

  const handleModelSelect = (item: PopoverItem) => {
    setSelectedModel(item.label);
  };

  const onEnqueuedPressed = async () => {
    // takes snap shot and then a global variable in the engine will invoke the inference.
    const image = await captureStageImageBitmap(stageRef, transformerRefs);
    if (!image) {
      console.error("Failed to capture stage image");
      return;
    } else {
      setCanvasRenderBitmap(image);
    }
  };

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
      y: (containerHeight - canvasH) / 2
    });
  }

  // Create a function to use the left layer ref and download the bitmap from it
  const downloadLeftPanelBitmap = async(): Promise<Uint8Array> => {
    if (!stageRef.current || !leftPanelRef.current || !rectRef.current) {
      console.error("Stage or left panel ref is not available");
      return;
    }

    const layer = leftPanelRef.current;

    // Get the canvas area that's covered by the image/rectangle
    const rect = rectRef.current;
    const layerCrop = layer.toCanvas({
      x: stageRef.current.x(),
      y: stageRef.current.y(),
      width: rect.width() * stageRef.current.scaleX(),
      height: rect.height() * stageRef.current.scaleY(),
      pixelRatio: 1 / stageRef.current.scaleX(),
    });

    // // Using the pixelRatio scaling may result in off-by-one rounding errors,
    // // So we re-fit the image to a canvas of precise size.
    // const fittedCanvas = normalizeCanvas(layerCrop, rect.width(), rect.height());
    // const downloadCallback = (blob: Blob | null) => {
    //   if (!blob) {
    //     console.error("Failed to create blob from canvas");
    //     return;
    //   }
    //   const url = URL.createObjectURL(blob);
    //   const link = document.createElement("a");
    //   link.href = url;
    //   link.download = "artcraft_snapshot.png";
    //   link.click();
    //   console.log('downloadCallback', url);
    // }
    // fittedCanvas.toBlob(downloadCallback, "image/png", 1.0);

    const normalizeCanvas2 = (canvas: HTMLCanvasElement, width: number, height: number): OffscreenCanvas => {
      const newCanvas = new OffscreenCanvas(width, height);

      const ctx = newCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(canvas, 0, 0, width, height);
      return newCanvas;
    }

    const fittedCanvas2 = normalizeCanvas2(layerCrop, rect.width(), rect.height());

    const blob = await fittedCanvas2.convertToBlob({ type: 'image/png' });
    const arrayBuffer = await blob.arrayBuffer();
  
    return new Uint8Array(arrayBuffer);

  };

  const handleGenerate = async (prompt: string) => {
    const editedImageToken = store.baseImageInfo?.mediaToken;

    if (!editedImageToken) {
      console.error("Base image is not available");
      return;
    }

    // TODO: Call inference API here
    let arrayBuffer = await downloadLeftPanelBitmap();

    const response = await EnqueueImageInpaint({
      model: EnqueueImageInpaintModel.FluxPro1,
      image_media_token: editedImageToken,
      mask_image_raw_bytes: arrayBuffer,
      prompt: prompt,
      image_count: 1,
    });
  };

  // Display image selector on launch, otherwise hide it
  // Also show loading state if info is set but image is loading
  if (!store.baseImageInfo || !store.baseImageBitmap) {
    return (
      <div className={"h-screen w-full flex items-center justify-center bg-ui-panel"}>
        <BaseImageSelector
          onImageSelect={(image: BaseSelectorImage) => {
            store.setBaseImageInfo(image);
          }}
          showLoading={store.baseImageInfo !== null && store.baseImageInfo === null}
        />
      </div>
    )
  }

  return (
    <>
      <div
        className={`preserve-aspect-ratio fixed top-0 left-1/2 z-10 -translate-x-1/2 transform ${isSelecting ? "pointer-events-none" : "pointer-events-auto"
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
        className={`preserve-aspect-ratio fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform ${isSelecting ? "pointer-events-none" : "pointer-events-auto"
          }`}
      >
        <PromptEditor
          onModeChange={(mode: string) => { store.setActiveTool(mode as ActiveEditTool) }}
          selectedMode={store.activeTool}
          onGenerateClick={handleGenerate}
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
                return true
              } else {
                console.log("No item is selected.");
                return false
              }
            }
            return false
          }}
          onMenuAction={async (action) => {
            switch (action) {
              case 'DUPLICATE':
                store.copySelectedItems()
                store.pasteItems()
                break;
              case 'DELETE':
                store.deleteSelectedItems()
                break;
              default:
              // No action needed for unhandled cases
            }
          }}
          isLocked={store.selectedNodeIds.some(id => {
            const node = store.nodes.find(n => n.id === id);
            const lineNode = store.lineNodes.find(n => n.id === id);
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
            baseImageRef={rectRef}
          />
        </ContextMenuContainer>
      </div>
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
        <PopoverMenu
          items={modelList}
          onSelect={handleModelSelect}
          mode="hoverSelect"
          panelTitle="Select Model"
          panelClassName="min-w-[280px]"
          buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
          showIconsInList
          triggerLabel="Model"
        />
        <button
          className="bg-transparent p-2 text-lg text-white hover:text-white hover:bg-white/20 rounded transition"
          onClick={onFitPressed}
        >
          Fit
        </button>
      </div>
    </>
  );
};

export default PageEdit;
