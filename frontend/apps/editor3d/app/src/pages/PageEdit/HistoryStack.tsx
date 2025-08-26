import { Button } from "@storyteller/ui-button";
import { useImageEditCompleteEvent } from "@storyteller/tauri-events";
import {
  faClockRotateLeft,
  faTrash,
  faTrashXmark,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { BaseSelectorImage } from "./BaseImageSelector";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  isActionReminderOpen,
  showActionReminder,
} from "@storyteller/ui-action-reminder-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
    <div className="h-auto w-20 rounded-lg">
      <div className="glass max-h-1/2 flex flex-col-reverse items-center justify-center gap-2 overflow-y-auto rounded-lg p-1.5">
        {imageBundles.map((bundle, index) => (
          <>
            {bundle.images.map((image, imgIndex) => (
              <Button
                key={imgIndex}
                className={twMerge(
                  "relative aspect-square h-full w-full border-2 bg-transparent p-0 hover:bg-transparent hover:opacity-80",
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
            {index < imageBundles.length - 1 && (
              <hr className="h-0.5 w-3/4 rounded-md border-none bg-white/10" />
            )}
          </>
        ))}
        <FontAwesomeIcon
          icon={faClockRotateLeft}
          className="p-1 text-gray-400"
        />
      </div>

      <div className="mt-3 flex justify-center">
        <div className="glass w-fit rounded-xl border-2 border-red/50 shadow-lg hover:border-red/80">
          <div className="relative h-full">
            <Tooltip
              content="Reset All"
              position="left"
              closeOnClick={true}
              className="ms-1 rounded-md bg-red px-3 py-1"
              delay={100}
            >
              <button
                className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent text-white transition-colors hover:bg-red/50"
                onClick={() =>
                  showActionReminder({
                    reminderType: "default",
                    title: "Reset All",
                    primaryActionIcon: faTrashXmark,
                    primaryActionBtnClassName: "bg-red hover:bg-red/80",
                    message: (
                      <p className="text-sm text-white/70">
                        Are you sure you want to reset all? This will clear all
                        your work and cannot be undone.
                      </p>
                    ),
                    primaryActionText: "Reset all",
                    onPrimaryAction: () => {
                      handleClear();
                      isActionReminderOpen.value = false;
                    },
                  })
                }
              >
                <FontAwesomeIcon icon={faXmark} className="h-5 w-5 text-xl" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
