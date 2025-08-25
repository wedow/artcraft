import { Button } from "@storyteller/ui-button";
import {
  EditedImage,
  useImageEditCompleteEvent,
} from "@storyteller/tauri-events";
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
  onImageSelect = () => {},
  startingBundles = [],
}: HistoryStackProps) => {
  const [imageBundles, setImageBundles] =
    useState<ImageBundle[]>(startingBundles);
  useImageEditCompleteEvent(async (event) => {
    const newBundle: ImageBundle = {
      images: event.edited_images.map(
        (editedImage) =>
          ({
            url: editedImage.cdn_url,
            mediaToken: editedImage.media_token,
          }) as BaseSelectorImage,
      ),
    };

    imageBundles.push(newBundle);
    setImageBundles(imageBundles);
  });

  const handleClear = () => {
    setImageBundles(startingBundles);
    onClear();
  };

  return (
    <div className="max-h-1/2 glass h-auto w-16 overflow-y-auto rounded-lg p-1">
      <div className="flex flex-col-reverse items-center justify-center">
        <Button
          className="h-7 w-full rounded-md opacity-80"
          iconClassName="h-3 w-3"
          icon={faTrash}
          type="reset"
          onClick={handleClear}
          variant="destructive"
        />
        {imageBundles.map((bundle) => (
          <>
            <hr className="my-2 h-0.5 w-3/4 rounded-md border-none bg-white/10" />
            {bundle.images.map((image, imgIndex) => (
              <Button
                key={imgIndex}
                className="aspect-square h-full w-full border-2 p-0"
                onClick={() => {
                  onImageSelect(image);
                }}
              >
                {/* TODO: Fix CORS issue here */}
                <img
                  src={image.url + "?historystack+" + Math.random()}
                  alt=""
                  crossOrigin="anonymous"
                  className="h-full w-full rounded-lg object-cover"
                />
              </Button>
            ))}
          </>
        ))}
      </div>
    </div>
  );
};
