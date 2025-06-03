import React, { useState, useEffect, useRef } from 'react';
import { Mirai } from './Mirai';
// https://github.com/SaladTechnologies/comfyui-api
import './App.css'
import PromptEditor from './PromptEditor/PromptEditor';
import SideToolbar from './SideToolbar';
// Import the Zustand store
import { useSceneStore } from './SceneState';
import { useUndoRedoHotkeys } from './hooks/useUndoRedoHotkeys';
import { useDeleteHotkeys } from './hooks/useDeleteHotkeys';
import { useCopyPasteHotkeys } from './hooks/useCopyPasteHotkeys'; // Import the hook

const App = (): JSX.Element => {

  // State for canvas dimensions
  const canvasWidth = React.useRef<number>(1024);
  const canvasHeight = React.useRef<number>(1024);
  // Add new state to track if user is selecting
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  // Use the Zustand store
  const store = useSceneStore();
  
  // Pass store actions directly as callbacks
  useDeleteHotkeys({ onDelete: store.deleteSelectedItems });
  useUndoRedoHotkeys({ undo: store.undo, redo: store.redo });
  useCopyPasteHotkeys({ onCopy: store.copySelectedItems, onPaste: store.pasteItems });

  const handleImageUpload = (files: File[]): void => {
    // Place images at center of viewport with offset for multiple images
    const centerX = 512; // leftPanelWidth / 2
    const centerY = 512; // leftPanelHeight / 2
    
    files.forEach((file, index) => {
      store.createImageFromFile(
        centerX + (index * 60), // Offset each image
        centerY + (index * 60),
        file
      );
    });
  };

  return (
    <>
     <div className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 preserve-aspect-ratio z-10 ${
       isSelecting ? 'pointer-events-none' : 'pointer-events-auto'
     }`}> 
      <PromptEditor
        initialPrompt=""
        onPromptChange={(prompt: string) => {
          console.log('Prompt changed:', prompt);
          // Handle prompt changes here
        }}
        onRandomize={() => {
          console.log('Randomize clicked');
          // Handle randomize action here
        }}
        onVary={() => {
          console.log('Vary clicked');
          // Handle vary action here
        }}
        onAIStrengthChange={(strength: number) => {
          console.log('AI Strength:', strength);
          // Handle AI strength changes here
        }}
        onAspectRatioChange={(ratio: string) => {
          console.log('Aspect ratio:', ratio);
          // Handle aspect ratio changes here
        }}
        onImageStyleChange={(images: string[]) => {
          console.log('Image styles:', images);
          // Handle image style changes here
        }}
      />
    </div>
    <SideToolbar className="fixed left-0 top-1/2 transform -translate-y-1/2 z-10"
      onSelect={(): void => {
        store.setActiveTool("select")
      }}
      onAddShape={(shape: 'rectangle' | 'circle' | 'triangle'): void => {
        // Calculate center position based on canvas dimensions
        const centerX = canvasWidth.current / 3;
        const centerY = canvasHeight.current / 3;
        if (shape === 'rectangle') {
          store.createRectangle(centerX, centerY);
        } else if (shape === 'circle') {
          store.createCircle(centerX, centerY);
        } else if (shape === 'triangle') {
          store.createTriangle(centerX, centerY);
        }

      }}
      onPaintBrush={(hex: string, size: number): void => {
        store.setActiveTool("draw")
        store.setBrushColor(hex);
        store.setBrushSize(size);
      }}
      onEraser={(size: number): void => {
        store.setActiveTool("eraser")
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
        console.log("Clicking");
        // Create input element dynamically like in PromptEditor
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true; // Allow multiple file selection
        input.onchange = (e: Event) => {
          const target = e.target as HTMLInputElement;
          if (target.files) {
            const files = Array.from(target.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
              handleImageUpload(imageFiles);
            }
          }
        };
        input.click();
      }}
      onDelete={(): void => { // This onDelete prop for SideToolbar might still be needed for the button
        store.deleteSelectedItems();
      }}
      activeToolId={store.activeTool}
    />
    <div className="relative z-0">
        <Mirai 
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
        />
      </div>
    </>
  );
};

export default App;
