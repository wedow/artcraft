import { useState, useRef } from "react";
import { JobContextType } from "libs/common/src/lib/types";
import { PromptBoxVideo } from "@storyteller/ui-promptbox";

const ImageToVideo = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageBeingProcessed, setIsImageBeingProcessed] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const handleAddImage = (image: File) => {
    setSelectedImage(image);
    setIsImageBeingProcessed(true);
    setImagePreviewUrl(URL.createObjectURL(image));

    // TODO: Implement actual image processing here
    // For now, we'll just simulate processing
    setTimeout(() => {
      setIsImageBeingProcessed(false);
    }, 3000);
  };

  const jobContext: JobContextType = {
    jobTokens: [],
    addJobToken: () => {},
    removeJobToken: () => {},
    clearJobTokens: () => {},
  };

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full rounded-lg bg-ui-background"
    >
      <div className="h-full w-full p-4">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-gray-800">
          <PromptBoxVideo
            uploadImage={async (file: File) => {
              // TODO: Implement file upload logic
              console.log("Uploading file:", file);
              return { url: "", mediaToken: "" };
            }}
            getCanvasRenderBitmap={() => {}}
            EncodeImageBitmapToBase64={async (bitmap: ImageBitmap) => {
              // TODO: Implement bitmap encoding
              console.log("Encoding bitmap to base64");
              return "";
            }}
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
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
