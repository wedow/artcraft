import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import dayjs from "dayjs";
import { faDownToLine } from "@fortawesome/pro-solid-svg-icons";
import {
  EnqueueImageTo3dObject,
  EnqueueImageTo3dObjectModel,
} from "@storyteller/tauri-api";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import React from "react";

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseGallery: () => void;
  imageUrl?: string | null;
  imageAlt?: string;
  onImageError?: () => void;
  title?: string;
  createdAt?: string;
  additionalInfo?: React.ReactNode;
  downloadUrl?: string;
  mediaId?: string;
  onDownloadClicked?: (url: string, mediaClass?: string) => Promise<void>;
  onAddToSceneClicked?: (
    url: string,
    media_id: string | undefined
  ) => Promise<void>;
  mediaClass?: string;
}

export function LightboxModal({
  isOpen,
  onClose,
  onCloseGallery,
  imageUrl,
  imageAlt = "",
  onImageError,
  title,
  createdAt,
  additionalInfo,
  downloadUrl, // cdn url of the image
  mediaId, // media id of the image
  onDownloadClicked,
  onAddToSceneClicked,
  mediaClass,
}: LightboxModalProps) {
  // NB(bt,2025-06-14): We add ?cors=1 to the image url to prevent caching "sec-fetch-mode: no-cors" from
  // the <image> tag request from being cached. If we then drag it into the canvas after it's been cached,
  // it won't be able to load in cors mode and will show blank in the canvas and 3D engine. This is a really
  // stupid hack around this behavior.
  const imageTagImageUrl = imageUrl ? imageUrl + "?cors=1" : "";

  const [mediaLoaded, setMediaLoaded] = React.useState<boolean>(false);

  // Reset when imageUrl changes
  React.useEffect(() => {
    setMediaLoaded(false);
  }, [imageUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="rounded-xl bg-[#2C2C2C] h-[80vh] w-[60vw] max-w-screen"
      draggable
      allowBackgroundInteraction={true}
      showClose={true}
      closeOnOutsideClick={false}
      resizable={true}
      backdropClassName="pointer-events-none hidden"
    >
      {/* Invisible drag handle strip at the very top for moving */}
      <Modal.DragHandle>
        <div className="absolute left-0 top-0 z-20 h-12 w-full cursor-move rounded-t-xl" />
      </Modal.DragHandle>

      {/* content grid */}
      <div className="grid h-full grid-cols-3 gap-6">
        {/* image panel */}
        <div className="col-span-2 relative flex h-full items-center justify-center overflow-hidden rounded-l-xl bg-[#1A1A1A]">
          {!imageUrl ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-800">
              <span className="text-white/60">Image not available</span>
            </div>
          ) : mediaClass === "video" ? (
            <video
              controls
              className="h-full w-full object-contain"
              onLoadedData={() => setMediaLoaded(true)}
            >
              <source src={imageUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={imageTagImageUrl}
              alt={imageAlt}
              className="h-full w-full object-contain"
              onError={onImageError}
              onLoad={() => setMediaLoaded(true)}
            />
          )}

          {!mediaLoaded && imageUrl && (
            <div className="absolute inset-0 bg-[#1A1A1A] flex items-center justify-center">
              <LoadingSpinner className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        {/* info + actions */}
        <div className="flex h-full flex-col py-5 pe-5">
          <div className="flex-1 space-y-4">
            <div className="text-xl font-medium">
              {title || "Image Generation"}
            </div>
            {createdAt && (
              <div className="text-sm text-white/60">
                Created: {dayjs(createdAt).format("MMM D, YYYY HH:mm:ss")}
              </div>
            )}
            {additionalInfo}
          </div>

          {/* buttons with spacing */}
          {(onAddToSceneClicked && downloadUrl) || downloadUrl ? (
            <div className="mt-15 mb-15 flex justify-end gap-2">
              <Button
                onClick={async (e) => {
                  //let _result = await FalHunyuanImageTo3d({
                  //  image_media_token: mediaId,
                  //  //base64_image: downloadUrl,
                  //});
                  let result = await EnqueueImageTo3dObject({
                    image_media_token: mediaId,
                    model: EnqueueImageTo3dObjectModel.Hunyuan3d2,
                  });
                  //e.stopPropagation();
                  //await onAddToSceneClicked(downloadUrl, mediaId);
                  //onClose(); // close the lightbox
                  //onCloseGallery(); // close the gallery
                }}
              >
                3D
              </Button>

              {onAddToSceneClicked && downloadUrl && (
                <Button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onAddToSceneClicked(downloadUrl, mediaId);
                    onClose(); // close the lightbox
                    onCloseGallery(); // close the gallery
                  }}
                >
                  Add to Current Scene
                </Button>
              )}

              {downloadUrl &&
                (onDownloadClicked ? (
                  <Button
                    icon={faDownToLine}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onDownloadClicked(downloadUrl, mediaClass);
                    }}
                  >
                    Download
                  </Button>
                ) : (
                  <a
                    href={downloadUrl}
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="no-underline"
                  >
                    <Button icon={faDownToLine}>Download</Button>
                  </a>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default LightboxModal;
