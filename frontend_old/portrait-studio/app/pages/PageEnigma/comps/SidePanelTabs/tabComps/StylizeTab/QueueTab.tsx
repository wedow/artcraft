import { TabTitle } from "~/pages/PageEnigma/comps/SidePanelTabs/sharedComps/TabTitle";
import { useSignals } from "@preact/signals-react/runtime";
import { QueueCard } from "./QueueCard";
import { editorState, previewSrc, queueData } from "~/pages/PageEnigma/signals";
import { EditorStates } from "~/pages/PageEnigma/enums";
import Queue, { QueueNames } from "~/pages/PageEnigma/Queue";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/pro-solid-svg-icons";

interface QueueTabProps {
  isStylizeSidePanel?: boolean;
}

export function QueueTab({ isStylizeSidePanel }: QueueTabProps) {
  useSignals();

  // DUMMY CONTENT
  // const queueData = [
  //
  //   {
  //     prompt:
  //       "8k, photoreal, extremely high detail, (unreal render), red 1980s porche with realistic reflections, blue sky with clouds in the background",
  //     imgSrc: "/resources/images/queue-placeholder.png",
  //     isGenerating: true,
  //   },
  //   {
  //     prompt:
  //       "8k, photoreal, extremely high detail, (unreal render), red 1980s porche with realistic reflections, blue sky with clouds in the background",
  //     imgSrc: "/resources/images/queue-placeholder.png",
  //   },
  // ];

  const switchPreview = async () => {
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.ENTER_PREVIEW_STATE,
      data: null,
    });
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <TabTitle
        title="Queue"
        isStylizeSidePanel={isStylizeSidePanel}
        showCloseButton={false}
        className="pt-1"
      />
      <div className="mt-2 overflow-y-auto">
        {queueData.value.length === 0 ? (
          // Empty placeholder
          <div className="mx-5 mt-2 flex flex-col gap-4">
            <div className="flex aspect-video items-center justify-center rounded-lg bg-brand-secondary/40 text-[15px] text-white/50">
              <FontAwesomeIcon icon={faImage} className="me-2.5" />
              Your generations will appear here.
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-4 w-full rounded-md bg-brand-secondary/40" />
              <div className="h-4 w-[80%] rounded-md bg-brand-secondary/40" />
              <div className="h-4 w-[90%] rounded-md bg-brand-secondary/40" />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="h-3 w-[25%] rounded-md bg-brand-secondary/40" />
              <div className="h-6 w-[25%] rounded-md bg-brand-secondary/40" />
            </div>
          </div>
        ) : (
          <>
            {queueData.value
              .slice(0)
              .reverse()
              .map((item, index) => (
                <QueueCard
                  key={index}
                  prompt={item.prompt}
                  imgSrc={item.imgSrc}
                  isGenerating={item.isGenerating}
                  createdDate={item.createdDate ?? new Date()}
                  onClick={() => {
                    if (item.isGenerating) return;
                    previewSrc.value = item.imgSrc;
                    editorState.value = EditorStates.PREVIEW;
                  }}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
