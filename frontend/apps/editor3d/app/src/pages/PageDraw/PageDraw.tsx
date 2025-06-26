import { useState, useRef, useEffect } from "react";
import { PaintSurface } from "./PaintSurface";
// https://github.com/SaladTechnologies/comfyui-api

import "./App.css";
import PromptEditor from "./PromptEditor/PromptEditor";
import SideToolbar from "./components/ui/SideToolbar";
// Import the Zustand store
import { AspectRatioType, useSceneStore } from "./stores/SceneState";
import { useUndoRedoHotkeys } from "./hooks/useUndoRedoHotkeys";
import { useDeleteHotkeys } from "./hooks/useDeleteHotkeys";
import { useCopyPasteHotkeys } from "./hooks/useCopyPasteHotkeys"; // Import the hook
import { PopoverItem, PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faImage } from "@fortawesome/pro-solid-svg-icons";
import Konva from "konva"; // just for types

import { setCanvasRenderBitmap } from "../../signals/canvasRenderBitmap"
import { captureStageImageBitmap } from "./hooks/useUpdateSnapshot"
import { ContextMenuContainer } from "./components/ui/ContextMenu";
import {
  FalBackgroundRemoval,
  FalBackgroundRemovalRequest,
} from "@storyteller/tauri-api";


  /**
 * This decodes Base64 encoded PNG images into an image element.
 * @param base64String a standard (not "web safe") base64-encoded string
 */
  export const DecodeBase64ToImage = async (base64String: string) : Promise<ImageBitmap> => {
    // Create an image element
    const img = document.createElement("img");
  
    // Convert base64 to data URL if it doesn't include the prefix
    const dataUrl = base64String.startsWith("data:")
      ? base64String
      : `data:image/png;base64,${base64String}`;
  
    // Create a promise to handle the image loading
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          const bitmap = await createImageBitmap(img);
          resolve(bitmap);
        } catch (error) {
          reject(error);
        }
      };
  
      img.onerror = () => reject(new Error("Failed to load image"));
  
      // Set the source to trigger loading
      img.src = dataUrl;
    });
  }

const PageDraw = () => {
  //useStateSceneLoader();

  // State for canvas dimensions
  const canvasWidth = useRef<number>(1024);
  const canvasHeight = useRef<number>(1024);
  // Add new state to track if user is selecting
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("GPT-4o");
  // Create refs for stage and image
  const stageRef = useRef<Konva.Stage>({} as Konva.Stage);
  const transformerRefs = useRef<{ [key: string]: Konva.Transformer }>({});

  // Use the Zustand store
  const store = useSceneStore();

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

  return (
    <>
      <div
        className={`preserve-aspect-ratio fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform ${
          isSelecting ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <PromptEditor
          initialPrompt=""
          onPromptChange={(prompt: string) => {
            console.log("Prompt changed:", prompt);
            // Handle prompt changes here
          }}
          onRandomize={() => {
            console.log("Randomize clicked");
            // Handle randomize action here
          }}
          onVary={() => {
            console.log("Vary clicked");
            // Handle vary action here
          }}
          onAspectRatioChange={(ratio: string) => {
            console.log("Aspect ratio:", ratio);
            // Convert ratio string to AspectRatioType enum
            const ratioToType = (ratio: string): AspectRatioType => {
              switch (ratio) {
                case "2:3":
                  return AspectRatioType.PORTRAIT;
                case "3:2":
                  return AspectRatioType.LANDSCAPE;
                case "1:1":
                  return AspectRatioType.SQUARE;
                default:
                  return AspectRatioType.NONE;
              }
            };

            const aspectRatioType = ratioToType(ratio);
            store.setAspectRatioType(aspectRatioType);
            onFitPressed()
          }}
          onEnqueuePressed={onEnqueuedPressed}
        />
      </div>
      <SideToolbar
        className="fixed left-0 top-1/2 z-10 -translate-y-1/2 transform"
        onSelect={(): void => {
          store.setActiveTool("select");
        }}
        onAddShape={(shape: "rectangle" | "circle" | "triangle"): void => {
          // Calculate center position based on canvas dimensions
          const centerX = canvasWidth.current / 3;
          const centerY = canvasHeight.current / 3;
          if (shape === "rectangle") {
            store.createRectangle(centerX, centerY);
          } else if (shape === "circle") {
            store.createCircle(centerX, centerY);
          } else if (shape === "triangle") {
            store.createTriangle(centerX, centerY);
          }
        }}
        onPaintBrush={(hex: string, size: number, opacity: number): void => {
          store.setActiveTool("draw");
          store.setBrushColor(hex);
          store.setBrushSize(size);
          store.setBrushOpacity(opacity);
        }}
        onEraser={(size: number): void => {
          store.setActiveTool("eraser");
          store.setBrushSize(size);
        }}
        onCanvasBackground={(hex: string): void => {
          console.log("Canvas background activated", { color: hex });
          // Add background change logic here
          // TODO: minor bug needs to update the preview panel
          // Debounce also causes issues with real time color change.
          store.setFillColor(hex);
        }}
        onGenerateImage={(): void => {
          console.log("Generate image activated");
          // Add image generation logic here
        }}
        onUploadImage={(): void => {
          // Create input element dynamically like in PromptEditor
          console.log("Upload image activated");
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.multiple = true;
          input.style.display = "none"; // Hide the input

          // Attach to DOM
          document.body.appendChild(input);

          input.onchange = (e: Event) => {
            console.log("File change event triggered");
            const target = e.target as HTMLInputElement;
            if (target.files) {
              const files = Array.from(target.files);
              console.log("Selected files:", files);
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/"),
              );
              console.log("Filtered image files:", imageFiles);

              if (imageFiles.length > 0) {
                console.log("Uploading images:", imageFiles);
                handleImageUpload(imageFiles);
              } else {
                console.log("No valid image files selected");
              }
            } else {
              console.log("No files selected");
            }
            // Clean up: remove input from DOM after use
            document.body.removeChild(input);
          };

          // Reset value before click (for same file selection)
          input.value = "";
          input.click();
        }}
        onDelete={(): void => {
          // This onDelete prop for SideToolbar might still be needed for the button
          store.deleteSelectedItems();
        }}
        activeToolId={store.activeTool}
      />
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
            case 'LOCK':
              store.toggleLock(store.selectedNodeIds);
              break;
            case 'REMOVE_BACKGROUND':
              // returns a success if we have selected images only
              await store.removeBackground(store.selectedNodeIds, 
                async (success: boolean, image_base64: string, message: string) => {
                if (!success) {
                  console.error(message);
                  return { success: false };
                }
                try {
                  const response = await FalBackgroundRemoval({ base64_image: image_base64 });
                  if (response.status !== "success" || !("payload" in response)) {
                    console.error("Failed to remove background", response);
                    return { success: false };
                  }

                  const base64String = response.payload?.base64_bytes as string;
                  const binaryString = atob(base64String);
                  const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
                  const blob = new Blob([bytes], { type: "image/png" });
                  const file = new File([blob], "generated_image.png", { type: blob.type });
                  return { success: true, file };
                } catch (error) {
                  console.error("Failed to remove background", error);
                  return { success: false };
                }
              });
              break;
            case 'BRING_TO_FRONT':
              store.bringToFront(store.selectedNodeIds);
              break;
            case 'BRING_FORWARD':
              store.bringForward(store.selectedNodeIds);
              break;
            case 'SEND_BACKWARD':
              store.sendBackward(store.selectedNodeIds);
              break;
            case 'SEND_TO_BACK':
              store.sendToBack(store.selectedNodeIds);
              break;
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
        <PaintSurface
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

export default PageDraw;
