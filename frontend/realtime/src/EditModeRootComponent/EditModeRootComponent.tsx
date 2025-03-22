import { useCallback, useRef } from "react";
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { EditEngine } from "~/KonvaApp/EditEngine";
import { KonvaCanvasContainer } from "~/KonvaRootComponent/KonvaCanvasContainer";

export const EditModeRootComponent = ({ className }: { className: string }) => {
  useRenderCounter("EditModeRootComponent");

  const editEngineRef = useRef<EditEngine | null>(null);

  const konvaContainerCallbackRef = useCallback((node: HTMLDivElement) => {
    if (node !== null && editEngineRef.current === null) {
      editEngineRef.current = new EditEngine(node);
    }
  }, []);

  return (
    <>
      <KonvaCanvasContainer
        className={className}
        ref={konvaContainerCallbackRef}
      />
    </>
  );
};
