import { useCallback, useContext } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import { pageHeight, pageWidth } from "~/signals";
import { editorLetterBox, timelineHeight } from "~/pages/PageEnigma/signals";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { Letterbox } from "./Letterbox";

export const SceneContainer = ({ children }: { children: React.ReactNode }) => {
  useSignals();
  const editorEngine = useContext(EngineContext);

  const containerWidth = pageWidth.value;

  const containerHeight = pageHeight.value - timelineHeight.value - 64;

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
