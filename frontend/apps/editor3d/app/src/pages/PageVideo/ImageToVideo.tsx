import { useState, useEffect, useRef } from "react";
import { PromptBox2D } from "@storyteller/ui-promptbox";
import { UploaderState } from "libs/common/src/lib/interfaces";
import {
  MaybeCanvasRenderBitmapType,
  JobContextType,
} from "libs/common/src/lib/types";

const ImageToVideo = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const uploadImage = ({
    title,
    assetFile,
    progressCallback,
  }: {
    title: string;
    assetFile: File;
    progressCallback: (newState: UploaderState) => void;
  }): Promise<void> => {
    throw new Error("Function not implemented.");
  };

  const getCanvasRenderBitmap = (): MaybeCanvasRenderBitmapType => {
    throw new Error("Function not implemented.");
  };

  const EncodeImageBitmapToBase64 = (
    imageBitmap: ImageBitmap,
  ): Promise<string> => {
    throw new Error("Function not implemented.");
  };

  const useJobContext = (): JobContextType => {
    throw new Error("Function not implemented.");
  };

  return (
    <div
      ref={containerRef}
      className="flex h-[calc(100vh-56px)] w-full bg-ui-background"
    >
      <div className="h-full w-1/2 p-4">
        <div className="flex h-full w-full items-center justify-center rounded-md bg-gray-800">
          <div className="text-white text-opacity-50">Image Display</div>
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src=""
              alt="Preview"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageToVideo;
