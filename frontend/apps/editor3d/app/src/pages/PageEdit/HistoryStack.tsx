import { Button } from "@storyteller/ui-button";
import { useImageEditCompleteEvent } from "@storyteller/tauri-events";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
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
  const [imageBundles, setImageBundles] =
    useState<ImageBundle[]>(startingBundles);
  const [selectedImageToken, setSelectedImageToken] = useState<string | null>(
    startingBundles.length > 0 && startingBundles[0].images.length > 0
      ? startingBundles[0].images[0].mediaToken
      : null,
  );
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

    setImageBundles([...imageBundles, newBundle]);
    const newlySelected = newBundle.images[0];
    if (newlySelected) {
      setSelectedImageToken(newlySelected.mediaToken);
      onImageSelect(newlySelected);
    }
  });

  // This is used to force image reloads in different sessions
  // and prevent fetching CORS-tainted images from cache
  const sessionRandBuster = useRef(Math.random());

  const handleClear = () => {
    setImageBundles(startingBundles);
    setSelectedImageToken(null);
    onClear();
  };

  return (
    <div className="max-h-1/2 glass h-auto w-16 overflow-y-auto rounded-lg p-1">
      <div className="flex flex-col-reverse items-center justify-center gap-2">
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
            <hr className="h-0.5 w-3/4 rounded-md border-none bg-white/10" />
            {bundle.images.map((image, imgIndex) => (
              <Button
                key={imgIndex}
                className={twMerge(
                  "aspect-square relative h-full w-full border-2 bg-transparent p-0 m-1 hover:bg-transparent hover:opacity-80",
                  selectedImageToken === image.mediaToken &&
                  "border-primary hover:opacity-100",
                )}
                onClick={() => {
                  setSelectedImageToken(image.mediaToken);
                  onImageSelect(image);
                }}
              >
                {/* TODO: Fix CORS issue here */}
                <img
                  src={image.url + "?historystack+" + sessionRandBuster.current}
                  alt=""
                  crossOrigin="anonymous"
                  className="absolute inset-0 h-full w-full rounded-lg object-cover"
                />
              </Button>
            ))}
          </>
        ))}
      </div>
    </div>
  );
};
