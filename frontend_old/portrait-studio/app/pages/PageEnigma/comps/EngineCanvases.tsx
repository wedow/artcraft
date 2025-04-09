import { useCallback, useContext } from "react";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";

export const EditorCanvas = () => {
  const editorEngine = useContext(EngineContext);

  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node && editorEngine) {
        if (!editorEngine.canvReference) {
          editorEngine.setEditorCanvas(node);
        } else {
          editorEngine.updateEngineCanvas(node);
        }
      }
    },
    [editorEngine],
  );

  return (
    <canvas
      ref={canvasCallbackRef}
      id="video-scene"
      width="1280px"
      height="720px"
    />
  );
};

export const CameraViewCanvas = ({ className }: { className?: string }) => {
  const editorEngine = useContext(EngineContext);
  const canvasCallbackRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node && editorEngine) {
        if (!editorEngine.canvasRenderCamReference) {
          editorEngine.setCamViewCanvas(node);
        } else {
          editorEngine.updateCamViewCanvas(node);
        }
      }
      //else just do nothing
    },
    [editorEngine],
  );

  return (
    <canvas className={className} ref={canvasCallbackRef} id="camera-view" />
  );
};
