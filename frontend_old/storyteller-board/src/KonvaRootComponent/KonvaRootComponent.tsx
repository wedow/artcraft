import { useCallback, useRef } from "react";

// Components
import { KonvaCanvasContainer } from "./KonvaCanvasContainer";
import { ContextualButtonRetry } from "./ContextualButtonRetry";
import { ContextualToolbarNode } from "./ContextualToolbarNode";
import { ContextualLoadingBar } from "./ContextualLoadingBar";
import { SignaledCanvasDragDropFiles } from "./SignaledCanvasDragDropFiles";
import { SignaledDialogs } from "./SignaledDialogs";
import { SignaledToolbarMain } from "./SignaledToolbarMain";
import { SignaledToolbarVideoExtraction } from "./SignaledToolbarVideoExtraction";

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
import { SignaledMagicBox } from "./SignaledMagicBox";

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
  const engineRef = useRef<EngineType | null>(null);

  const konvaContainerCallbackRef = useCallback((node: HTMLDivElement) => {
    if (node !== null && engineRef.current === null) {
      const options = {
        navigate: navigate,
        sceneToken: sceneToken,
      };
      engineRef.current = KonvaApp(node, options);
    }
  }, []);

  return (
    <>
      <KonvaCanvasContainer
        ref={konvaContainerCallbackRef}
        className={className}
        // retreive the classNames from the parent for sizing/styling
      />
      <SignaledMagicBox />
      <SignaledCanvasDragDropFiles
        openAddImage={appUiContext.openAddImage}
        openAddVideo={appUiContext.openAddVideo}
      />
      <SignaledToolbarMain
        layoutSignal={layoutContext.signal}
        appUiContext={appUiContext}
      />
      <SignaledToolbarVideoExtraction />
      <SignaledDialogs
        appUiSignal={appUiContext.signal}
        resetAll={appUiContext.resetAll}
      />

      <ContextualLoadingBar />
      <ContextualToolbarNode />
      <ContextualButtonRetry />
    </>
  );
};
