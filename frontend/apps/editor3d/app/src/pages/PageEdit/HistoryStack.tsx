import { Button } from "@storyteller/ui-button";
import { EditedImage, useImageEditCompleteEvent } from "@storyteller/tauri-events";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";
import { useState } from "react";
import { BaseSelectorImage } from "./BaseImageSelector";

export interface ImageBundle {
  images: BaseSelectorImage[];
}

interface HistoryStackProps {
  onClear: () => void;
  onImageSelect?: (image: BaseSelectorImage) => void;
  startingBundles: ImageBundle[];
}

export const HistoryStack = ({
  onClear,
  onImageSelect = () => { },
  startingBundles = [],
}: HistoryStackProps) => {

  const [imageBundles, setImageBundles] = useState<ImageBundle[]>(startingBundles);
  useImageEditCompleteEvent(async (event) => {
    const newBundle: ImageBundle = {
      images: event.edited_images.map((editedImage) => ({
        url: editedImage.cdn_url,
        mediaToken: editedImage.media_token,
      } as BaseSelectorImage)),
    };

    imageBundles.push(newBundle);
    setImageBundles(imageBundles);
  });

  const handleClear = () => {
    setImageBundles(startingBundles);
    onClear();
  }

  return (
    <div className="w-16 h-auto max-h-1/2 overflow-y-auto rounded-lg bg-white">
      <div className="flex flex-col-reverse items-center justify-center">
        <Button icon={faTrash} type="reset" onClick={handleClear} />
        {imageBundles.map((bundle) => (
          <>
            <hr className="border-none bg-red w-full rounded-md h-2" />
            {bundle.images.map((image, imgIndex) => (
              <Button key={imgIndex} className="w-full h-24" onClick={() => { onImageSelect(image) }}>
                {/* TODO: Fix CORS issue here */}
                <img
                  src={image.url + "?historystack+" + Math.random()}
                  alt=""
                  crossOrigin="anonymous"
                  className="w-full h-full rounded-lg"
                />
              </Button>
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
