import { ReactNode, useEffect, useState } from "react";
import { EngineContext, EditorExpandedI } from "./EngineContext";

import Editor from "~/pages/PageEnigma/Editor/editor";

interface Props {
  sceneToken?: string;
  children: ReactNode;
}

export const EngineProvider = ({ sceneToken, children }: Props) => {
  const [editor, setEditor] = useState<EditorExpandedI | null>(null);
  const [sceneContainer, setSceneContainer] = useState<HTMLDivElement | null>(
    null,
  );
  const [editorCanvas, setEditorCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [camViewCanvas, setCamViewCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  useEffect(() => {
    setEditor((curr) => {
      if (curr !== null) {
        console.warn("Editor Engine already exist");
        return curr;
      }

      class EditorExpanded extends Editor implements EditorExpandedI {
        setSceneContainer = setSceneContainer;
        setEditorCanvas = setEditorCanvas;
        setCamViewCanvas = setCamViewCanvas;
      }
      return new EditorExpanded();
    });
  }, []);

  useEffect(() => {
    if (
      editor &&
      editor.can_initialize &&
      editorCanvas &&
      camViewCanvas &&
      sceneContainer
    ) {
      editor.initialize({
        sceneToken: sceneToken || "",
        sceneContainerEl: sceneContainer,
        editorCanvasEl: editorCanvas,
        camViewCanvasEl: camViewCanvas,
      });
    }
  }, [editor, sceneToken, editorCanvas, camViewCanvas, sceneContainer]);

  return (
    <EngineContext.Provider value={editor}>{children}</EngineContext.Provider>
  );
};
