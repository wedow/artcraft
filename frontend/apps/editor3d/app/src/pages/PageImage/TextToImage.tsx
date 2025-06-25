import { useRef } from "react";
import { JobContextType } from "@storyteller/common";
import { PromptBoxImage } from "@storyteller/ui-promptbox";
import BackgroundGallery from "./BackgroundGallery";
import {
  imageGenerationModels,
  ModelCategory,
  ModelSelector,
  useModelSelectorStore,
} from "@storyteller/ui-model-selector";

interface TextToImageProps {
  imageMediaId?: string;
  imageUrl?: string;
}
import { IMAGE_MODELS_BY_LABEL } from "@storyteller/model-list";
import { ModelInfo } from "@storyteller/model-list";

const TextToImage = ({ imageMediaId, imageUrl }: TextToImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedModels } = useModelSelectorStore();

  const selectedModel =
    selectedModels[ModelCategory.TextToImage] ||
    imageGenerationModels[0]?.label;

  const selectedModelInfo : ModelInfo | undefined = IMAGE_MODELS_BY_LABEL[selectedModel];

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full rounded-lg bg-[#121212]"
    >
      <div className="h-full w-full p-4">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md pb-12">
          <div className="relative z-20 mb-12 flex flex-col items-center justify-center text-center drop-shadow-xl">
            <span className="text-7xl font-bold">Generate Image</span>
            <span className="pt-2 text-xl opacity-80">
              Add a prompt, then generate
            </span>
          </div>

          <PromptBoxImage
            useJobContext={() => {
              console.log("Using job context");
              return jobContext;
            }}
            model={selectedModel}
            modelInfo={selectedModelInfo}
            imageMediaId={imageMediaId}
            url={imageUrl ?? undefined}
            onEnqueuePressed={async () => {
              console.log("Enqueue pressed");
            }}
          />

          <BackgroundGallery />

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <ModelSelector
              items={imageGenerationModels}
              category={ModelCategory.TextToImage}
              mode="hoverSelect"
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

export default TextToImage;
