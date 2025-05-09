// to do fix https://codesandbox.io/p/sandbox/react-konva-infinite-grid-kkndq?file=%2Fsrc%2Findex.js the dotted background doesn't move when draggable.
import { Engine } from "../Engine";
import { EngineOptions } from "./types";
export { Engine as EngineType };
export const KonvaApp = (element: HTMLDivElement, options: EngineOptions) => {
  const engine = new Engine(element, options);
  engine.initializeStage(options.sceneToken);
  return engine;
};
