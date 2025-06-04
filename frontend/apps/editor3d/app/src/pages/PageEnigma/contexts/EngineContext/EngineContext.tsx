import { createContext } from "react";
import Editor from "~/pages/PageEnigma/Editor/editor";

export interface EditorExpandedI extends Editor {
  setSceneContainer: React.Dispatch<
    React.SetStateAction<HTMLDivElement | null>
  >;
  setEditorCanvas: React.Dispatch<
    React.SetStateAction<HTMLCanvasElement | null>
  >;
  setCamViewCanvas: React.Dispatch<
    React.SetStateAction<HTMLCanvasElement | null>
  >;
}

export const EngineContext = createContext<Editor | null>(null);
