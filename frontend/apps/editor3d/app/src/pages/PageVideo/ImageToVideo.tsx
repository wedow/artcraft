import { useState, useRef } from "react";
import { JobContextType } from "libs/common/src/lib/types";
import { PromptBoxVideo } from "@storyteller/ui-promptbox";
import BackgroundGallery from "./BackgroundGallery";
import { PopoverMenu, type PopoverItem } from "@storyteller/ui-popover";
import { faFilm, faClock } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ImageToVideo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState<string>("Kling 2.0");
  const [useSystemPrompt, setUseSystemPrompt] = useState(false);

  const [isImageBeingProcessed, setIsImageBeingProcessed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleClose = () => setIsDialogOpen(false);
  const handleAddImage = (image: File) => {
    setSelectedImage(image);
    setIsImageBeingProcessed(true);
    setImagePreviewUrl(URL.createObjectURL(image));
    setTimeout(() => setIsImageBeingProcessed(false), 3000);
  };

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  const modelList: PopoverItem[] = [
    {
      label: "Kling 2.0",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      selected: selectedModel === "Kling 2.0",
      description: "High quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
    {
      label: "Runway",
      icon: <FontAwesomeIcon icon={faFilm} className="h-4 w-4" />,
      selected: selectedModel === "Runway",
      description: "Fast and high-quality model",
      badges: [{ label: "2 min.", icon: <FontAwesomeIcon icon={faClock} /> }],
    },
  ];

  const handleModelSelect = (item: PopoverItem) => {
    setSelectedModel(item.label);
  };

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full rounded-lg bg-[#121212]"
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
            onEnqueuePressed={async () => {
              // TODO: Implement enqueue logic
              console.log("Enqueue pressed");
            }}
          />

          <BackgroundGallery />

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <PopoverMenu
              items={modelList}
              onSelect={handleModelSelect}
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

export default ImageToVideo;
