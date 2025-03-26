import { faArrowPointer, faArrowsCross, faCircleXmark, faCross, faEdit, faHandPointer, faLocationArrow, faLocationArrowUp, faMousePointer, faNavicon, faSparkles, faXmarkCircle, faXmarksLines } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSignals } from "@preact/signals-react/runtime";
import { useCallback, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { DialogAddImage } from "~/components/features";
import { Button, Slider, TabItem, TabSelector } from "~/components/ui";
import { useRenderCounter } from "~/hooks/useRenderCounter";
import { EditEngine } from "~/KonvaApp/EditEngine";
import { KonvaCanvasContainer } from "~/KonvaRootComponent/KonvaCanvasContainer";
import { EditMode, editModeBrushSize, editModeState, setEditModeBaseImage, setEditModeBrushSize, triggerEditModeClear } from "~/signals/editMode";

const tabs: TabItem[] = [
  { id: EditMode.SELECT, label: "Select", icon: faLocationArrow, iconClassName: "fa-flip-horizontal mr-1.5" },
  { id: EditMode.EDIT, label: "Edit Region", icon: faEdit },
];

const setEditMode = (tabId: string) => {
  editModeState.value = tabId as EditMode;
}

export const EditModeRootComponent = ({ className }: { className: string }) => {
  useRenderCounter("EditModeRootComponent");

  const editEngineRef = useRef<EditEngine | null>(null);

  const konvaContainerCallbackRef = useCallback((node: HTMLDivElement) => {
    if (node !== null && editEngineRef.current === null) {
      editEngineRef.current = new EditEngine(node);
    }
  }, []);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useSignals();
  const editMode = editModeState.value;

  return (
    <>
      <KonvaCanvasContainer
        className={className}
        ref={konvaContainerCallbackRef}
      />
      {editMode === EditMode.INIT ?
        (
          <DialogAddImage
            isOpen={true}
            onAddImage={setEditModeBaseImage}
            cancellable={false}
          />
        )
        :
        (
          <div className="fixed bottom-0 left-0 right-0 z-10 flex max-w-full items-center justify-center">
            <div
              className={twMerge(
                "absolute bottom-12 flex min-h-[56px] items-end rounded-xl p-3 transition-all duration-[400ms] ease-in-out",
              )}
            >
              <TabSelector
                tabs={tabs}
                activeTab={editMode}
                onTabChange={(tabId) => { setEditMode(tabId) }}
              />
              <Button
                icon={faSparkles}
                variant="primary"
                className="text-md ml-2 self-end"
                onClick={() => { }}
                disabled={false}
                loading={false}
              >
                Generate
              </Button>
            </div>
          </div >
        )}
      {editMode === EditMode.EDIT && (
        <div className="fixed top-20 left-0 right-0 z-10 flex max-w-full items-center justify-center">
          <div className="glass flex rounded-full items-center justify-center p-2">
            <EditModeBrushSlider />
            <Button icon={faCircleXmark} className="ml-2" variant="action"
              onClick={triggerEditModeClear}
            />
          </div>
        </div>
      )}
    </>
  );
};

const EditModeBrushSlider = () => {
  return (
    <Slider
      min={0}
      max={100}
      value={editModeBrushSize.value}
      onChange={setEditModeBrushSize}
      step={1}
      innerLabel={"Brush size"}
      showDecrement
      showIncrement
      className="w-[196px]"
    />
  )
}
