import { useCallback, useContext } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight, pageWidth } from "~/signals";
import {
  editorLetterBox,
  sidePanelWidth,
  sidePanelVisible,
  stylizeSidePanelVisible,
  stylizeSidePanelWidth,
} from "~/pages/PageEnigma/signals";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { Letterbox } from "./Letterbox";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  useSignals();
  const editorEngine = useContext(EngineContext);

  const containerWidth =
    pageWidth.value -
    (sidePanelVisible.value ? sidePanelWidth.value : 0) -
    (stylizeSidePanelVisible.value ? stylizeSidePanelWidth.value : 0) -
    75;

  const containerHeight = pageHeight.value - 56;

  const callbackRef = useCallback(
    (node: HTMLDivElement) => {
      if (node && editorEngine) {
        if (!editorEngine.container) {
          editorEngine.setSceneContainer(node);
        } else {
          editorEngine.updateSceneContainer(node);
        }
      }
    },
    [editorEngine],
  );

  return (
    <div
      ref={callbackRef}
      id="video-scene-container"
      className="relative"
      style={{
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {children}
      <Letterbox
        isShowing={editorLetterBox.value}
        width={containerWidth}
        height={containerHeight}
      />
    </div>
  );
};
