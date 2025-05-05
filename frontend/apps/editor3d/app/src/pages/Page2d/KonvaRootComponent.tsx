import { useCallback, useRef, useState } from "react";

// Components
import { KonvaCanvasContainer } from "./KonvaCanvasContainer";
import { ContextualToolbarNode } from "./ContextualToolbarNode";
import { SignaledCanvasDragDropFiles } from "./SignaledCanvasDragDropFiles";
import { SignaledDialogs } from "./SignaledDialogs";
import { SignaledToolbarMain } from "./SignaledToolbarMain";

import { PromptBox } from "~/components/PromptBox";
// The KonvaApp is the root of the Konva stage
// and only entry point for anything in Konva JS
import { EngineType } from "~/KonvaApp";
import { KonvaApp } from "~/KonvaApp";

// all the signal-contexts are wrapped in hooks
import { useAppUiContext } from "./contextSignals/appUi";
import { useLayoutContext } from "./contextSignals/layout";

// common hooks
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { useNavigate } from "react-router-dom";

import { UndoRedo } from "~/components/reusable/UndoRedo/UndoRedo";

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
  
  const konvaContainerCallbackRef = useCallback((node: HTMLDivElement) => {
    // Only initialize if we have a node and haven't initialized yet
    if (node !== null && !isEngineReady && engineRef.current === null) {
      try {
        const options = {
          navigate: navigate,
          sceneToken: sceneToken,
        };
        engineRef.current = KonvaApp(node, options);
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
          <SignaledCanvasDragDropFiles
            openAddImage={appUiContext.openAddImage}
            openAddVideo={appUiContext.openAddVideo}
          />
          <PromptBox />
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
