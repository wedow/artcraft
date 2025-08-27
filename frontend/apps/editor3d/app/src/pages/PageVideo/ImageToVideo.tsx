import { useRef } from "react";
import { JobContextType } from "@storyteller/common";
import { PromptBoxVideo } from "@storyteller/ui-promptbox";
import BackgroundGallery from "./BackgroundGallery";
import {
  ClassyModelSelector,
  IMAGE_TO_VIDEO_PAGE_MODEL_LIST,
  ModelPage,
} from "@storyteller/ui-model-selector";
import { VideoModel } from "@storyteller/model-list";
import { getSelectedVideoModel } from "@storyteller/ui-model-selector";

const PAGE_ID : ModelPage = ModelPage.ImageToVideo;

interface ImageToVideoProps {
  imageMediaId?: string;
  imageUrl?: string;
}

const ImageToVideo = ({ imageMediaId, imageUrl }: ImageToVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVideoModel : VideoModel | undefined = getSelectedVideoModel(PAGE_ID);

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full bg-[#121212]"
    >
      <div className="h-full w-full p-4">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md pb-12">
          <div className="relative z-20 mb-12 flex flex-col items-center justify-center text-center drop-shadow-xl">
            <span className="text-7xl font-bold">Generate Video</span>
            <span className="pt-2 text-xl opacity-80">
              Add an image, prompt, then generate
            </span>
          </div>

          <PromptBoxVideo
            useJobContext={() => {
              // TODO: Implement job context logic
              console.log("Using job context");
              return jobContext;
            }}
            selectedModel={selectedVideoModel}
            imageMediaId={imageMediaId}
            url={imageUrl ?? undefined}
            onEnqueuePressed={async () => {
              console.log("Enqueue pressed");
            }}
          />

          <BackgroundGallery />

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <ClassyModelSelector
              items={IMAGE_TO_VIDEO_PAGE_MODEL_LIST}
              page={PAGE_ID}
              panelTitle="Select Model"
              panelClassName="min-w-[280px]"
              buttonClassName="bg-transparent p-0 text-lg hover:bg-transparent text-white/80 hover:text-white"
              showIconsInList
              triggerLabel="Model"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
