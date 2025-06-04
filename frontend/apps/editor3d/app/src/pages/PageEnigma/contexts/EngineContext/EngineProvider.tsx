import { ReactNode, useEffect, useRef, useState } from "react";
import { EngineContext, EditorExpandedI } from "./EngineContext";

import Editor from "~/pages/PageEnigma/Editor/editor";
import { useSignals } from "@preact/signals-react/runtime";
import { appTabId } from "~/signals/appTab";
import { signal } from "@preact/signals-react";

interface Props {
  sceneToken?: string;
  children: ReactNode;
}

export const sceneContainerSignal = signal<HTMLDivElement | null>(null);
export const editorCanvasSignal = signal<HTMLCanvasElement | null>(null);
export const camViewCanvasSignal = signal<HTMLCanvasElement | null>(null);

export const EngineProvider = ({ sceneToken, children }: Props) => {
  useSignals();

  const [editor, setEditor] = useState<Editor | null>(null);
  const activeEditorRef = useRef<Editor | null>(null);

  const createEditor = () => {
    return new Editor();
  }

  const currentTabId = appTabId.value;
  const sceneContainer = sceneContainerSignal.value;
  const editorCanvas = editorCanvasSignal.value;
  const camViewCanvas = camViewCanvasSignal.value;
  useEffect(() => {
    if (sceneContainer && editorCanvas && camViewCanvas && currentTabId === "3D") {
      // DO NOTHING if another useEffect already created one and hasn't been removed
      if (activeEditorRef.current) {
        return;
      }

      const newEditor = createEditor();
      console.warn("Creating new Editor instance", newEditor);
      activeEditorRef.current = newEditor;
      newEditor.initialize({
        sceneToken: sceneToken || "",
        sceneContainerEl: sceneContainer,
        editorCanvasEl: editorCanvas,
        camViewCanvasEl: camViewCanvas,
      })
      setEditor(newEditor);
    } else if (currentTabId !== "3D") {
      // If the tab is changed, we unmount the editor and clear all input params
      activeEditorRef.current?.unmountEngine();
      activeEditorRef.current = null;
      sceneContainerSignal.value = null;
      editorCanvasSignal.value = null;
      camViewCanvasSignal.value = null;
    }
  }, [sceneToken, editorCanvas, camViewCanvas, setEditor, sceneContainer, currentTabId]);

  return (
    <EngineContext.Provider value={editor}>{children}</EngineContext.Provider>
  );
};
