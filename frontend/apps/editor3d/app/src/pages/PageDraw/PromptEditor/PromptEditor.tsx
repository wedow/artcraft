import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Slider from "./Slider";
import ImageStyleSelector from "./ImageStyleSelector";
import { PromptEditorProps, ImageStyle } from "./types";
import { PromptBox2D } from "@storyteller/ui-promptbox";
import { uploadImage } from "../../../components/reusable/UploadModalMedia/uploadImage";
import { getCanvasRenderBitmap } from "../../../signals/canvasRenderBitmap";
import { EncodeImageBitmapToBase64 } from "../utilities/EncodeImageBitmapToBase64";
import { JobProvider, useJobContext } from "../JobContext";

const PromptEditor: React.FC<PromptEditorProps> = ({
  onAIStrengthChange,
  onImageStyleChange,
}) => {
  const [aiStrength, setAIStrength] = useState(0.75);
  const [images, setImages] = useState<ImageStyle[]>([]);

  const handleAIStrengthChange = (strength: number) => {
    setAIStrength(strength);
    onAIStrengthChange?.(strength);
  };

  const handleImageSelect = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    const newImage: ImageStyle = {
      id: uuidv4(),
      url: imageUrl,
      weight: 0.5,
    };

    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    onImageStyleChange?.(updatedImages);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <div className="flex w-full justify-center">
        <Slider
          value={aiStrength}
          onChange={handleAIStrengthChange}
          height={32}
          width={"85%"}
        />
      </div>

      <JobProvider>
        <PromptBox2D
          uploadImage={uploadImage}
          getCanvasRenderBitmap={getCanvasRenderBitmap}
          EncodeImageBitmapToBase64={EncodeImageBitmapToBase64}
          useJobContext={useJobContext}
          onEnqueuePressed={async () => {
            // await renderEngineRef.current?.render(); //TODO: Render the canvas
          }}
        />
      </JobProvider>

      <ImageStyleSelector onImageSelect={handleImageSelect} />
    </div>
  );
};

export default PromptEditor;
