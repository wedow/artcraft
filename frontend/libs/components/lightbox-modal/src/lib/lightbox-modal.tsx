import { CloseButton } from "@storyteller/ui-close-button";
import { Button } from "@storyteller/ui-button";
import { Transition, TransitionChild } from "@headlessui/react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { faDownToLine } from "@fortawesome/pro-solid-svg-icons";
import {
  FalKlingImageToVideo,
  FalHunyuanImageTo3d,
} from "@storyteller/tauri-api";

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
  onDownloadClicked?: (url: string) => Promise<void>;
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
  return createPortal(
    <Transition appear show={isOpen}>
      <div className="fixed inset-0 z-[100]">
        {/* backdrop */}
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 cursor-pointer bg-black/60"
            onClick={onClose}
          />
        </TransitionChild>

        {/* dialog container */}
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className="relative h-[90vh] w-[80vw] rounded-xl bg-[#2C2C2C]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* close */}
              <CloseButton
                onClick={onClose}
                className="absolute right-4 top-4 z-10"
              />

              {/* content grid */}
              <div className="grid h-full grid-cols-3 gap-6">
                {/* image panel */}
                <div className="col-span-2 flex h-full items-center justify-center overflow-hidden rounded-l-xl bg-black/40">
                  {!imageUrl ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-800">
                      <span className="text-white/60">Image not available</span>
                    </div>
                  ) : mediaClass === "video" ? (
                    <video controls className="h-full w-full object-contain">
                      <source src={imageUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      className="h-full w-full object-contain"
                      onError={onImageError}
                    />
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
                        Created:{" "}
                        {dayjs(createdAt).format("MMM D, YYYY HH:mm:ss")}
                      </div>
                    )}
                    {additionalInfo}
                  </div>

                  {/* buttons with spacing */}
                  {(onAddToSceneClicked && downloadUrl) || downloadUrl ? (
                    <div className="mt-15 mb-15 flex justify-end gap-2">
                      <Button
                        onClick={async (e) => {
                          let _result = await FalHunyuanImageTo3d({
                            image_media_token: mediaId,
                            //base64_image: downloadUrl,
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
                              await onDownloadClicked(downloadUrl);
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
            </div>
          </TransitionChild>
        </div>
      </div>
    </Transition>,
    document.body
  );
}

export default LightboxModal;
