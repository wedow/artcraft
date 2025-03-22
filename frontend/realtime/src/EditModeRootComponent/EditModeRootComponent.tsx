import { faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { useCallback, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/ui";
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

  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <KonvaCanvasContainer
        className={className}
        ref={konvaContainerCallbackRef}
      />
      <div className="fixed bottom-0 left-0 right-0 z-10 flex max-w-full items-center justify-center">
        <div
          className={twMerge(
            "glass absolute bottom-12 flex min-h-[56px] w-full max-w-[900px] items-end rounded-xl border-2 p-3 shadow-xl transition-all duration-[400ms] ease-in-out",
            "focused:border-primary-400/6 border-ui-panel",
          )}
        >
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Describe what you want to see..."
            className="max-h-[120px] min-h-[40px] flex-1 resize-none overflow-y-auto rounded-md bg-transparent px-3 py-2 text-lg leading-normal focus:outline-none"
            style={{ lineHeight: "24px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
            autoFocus={true}
          />
          <Button
            icon={faSparkles}
            variant="primary"
            className="text-md ml-2 self-end"
            onClick={() => {}}
            disabled={false}
            loading={false}
          >
            Generate
          </Button>
        </div>
      </div>
    </>
  );
};
