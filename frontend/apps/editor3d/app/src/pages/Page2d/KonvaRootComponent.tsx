import { useCallback, useRef, useState } from "react";

// Components
import { KonvaCanvasContainer } from "./KonvaCanvasContainer";
import { ContextualToolbarNode } from "./ContextualToolbarNode";
// import { SignaledCanvasDragDropFiles } from "./SignaledCanvasDragDropFiles";
import { SignaledDialogs } from "./SignaledDialogs";
import { SignaledToolbarMain } from "./SignaledToolbarMain";

// The KonvaApp is the root of the Konva stage
// and only entry point for anything in Konva JS
import { EngineType } from "./KonvaApp";
import { KonvaApp } from "./KonvaApp";

// all the signal-contexts are wrapped in hooks
import { useAppUiContext } from "./contextSignals/appUi";
import { useLayoutContext } from "./contextSignals/layout";

// common hooks
import { useRenderCounter } from "./useRenderCounter";
import { useNavigate } from "react-router-dom";
import "./global.css";
// TODO REFACTOR THIS INTO THE COMPONENT LIBRARY its used in 3d and 2d

// These imports are required for the 2D prompt box component
// Job context is currently missing
import { PromptBox2D } from "@storyteller/ui-promptbox";
import { UndoRedo } from "./components/reusable/UndoRedo/UndoRedo";
import { getCanvasRenderBitmap } from "./signals/canvasRenderBitmap";
import { EncodeImageBitmapToBase64 } from "./utilities/EncodeImageBitmapToBase64";
import { uploadImage } from "../../components/reusable/UploadModalMedia/uploadImage";
// import { getCanvasRenderBitmap } from "./signals/canvasRenderBitmap";
// import { EncodeImageBitmapToBase64 } from "./utilities/EncodeImageBitmapToBase64";
import { JobProvider, useJobContext } from "./JobContext";
import { RealTimeDrawEngine } from "./KonvaApp/RenderingPrimitives/RealTimeDrawEngine";
import { VideoResolutions } from "./KonvaApp/constants";
export const KonvaRootComponent = ({
  className,
  sceneToken,
}: {
  className: string;
  sceneToken?: string;
}) => {
  // This is a hook that will log the number of times the component has rerendered
  // Let's make sure we only log once
  useRenderCounter("KonvaRootComponent");
  const navigate = useNavigate();
  const appUiContext = useAppUiContext();
  const layoutContext = useLayoutContext();

  // Add state to track engine initialization
  const [isEngineReady, setIsEngineReady] = useState(false);
  const engineRef = useRef<EngineType | null>(null);
  const renderEngineRef = useRef<RealTimeDrawEngine | null>(null);

  const konvaContainerCallbackRef = useCallback((node: HTMLDivElement) => {
    // Only initialize if we have a node and haven't initialized yet
    if (node !== null && !isEngineReady && engineRef.current === null) {
      try {
        const options = {
          navigate: navigate,
          sceneToken: sceneToken,
        };
       

        engineRef.current = KonvaApp(node, options);
        renderEngineRef.current = engineRef.current.realTimeDrawEngine;
        // Only set ready if initialization succeeded
        if (engineRef.current) {
          setIsEngineReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize KonvaApp:", error);
        engineRef.current = null;
        setIsEngineReady(false);
      }
    }
  }, [navigate, sceneToken, isEngineReady]);

  return (
    <>
      {/* Always render the canvas container */}
      <KonvaCanvasContainer
        ref={konvaContainerCallbackRef}
        className={className}
      />

      {/* Conditionally render the loading overlay */}
      {!isEngineReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Initializing canvas...</div>
        </div>
      )}

      {/* Conditionally render the UI components that need the engine */}
      {isEngineReady && engineRef.current && (
        <UndoRedo engine={engineRef.current}>

          {/* <SignaledCanvasDragDropFiles
            openAddImage={appUiContext.openAddImage}
            openAddVideo={appUiContext.openAddVideo}
          /> */}
          <JobProvider>
            <PromptBox2D
              uploadImage={uploadImage}
              getCanvasRenderBitmap={getCanvasRenderBitmap}
            EncodeImageBitmapToBase64={EncodeImageBitmapToBase64}
            useJobContext={useJobContext}
            onEnqueuePressed={async ()=> {
              // will set the snapshot of the canvas internally. 
              await renderEngineRef.current?.render();
            }}
          /> </JobProvider>
        
          <SignaledToolbarMain
            layoutSignal={layoutContext.signal}
            appUiContext={appUiContext}
          />
          <SignaledDialogs
            appUiSignal={appUiContext.signal}
            resetAll={appUiContext.resetAll}
          />
          <ContextualToolbarNode />
        </UndoRedo>
      )}
    </>
  );
};
