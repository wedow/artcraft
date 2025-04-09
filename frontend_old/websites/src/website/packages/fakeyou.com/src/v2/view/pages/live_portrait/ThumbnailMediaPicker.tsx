import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button } from "components/common";
import FaceCropper from "./FaceCropper";
import ThumbnailItem from "./ThumbnailItem";
import LoadingSpinner from "components/common/LoadingSpinner";
import {
  GetMedia,
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import {
  faUpload,
  faChevronLeft,
  faChevronRight,
  faXmark,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isMobile } from "react-device-detect";
import { Area } from "react-easy-crop";
import { useLocalize, useSession } from "hooks";

interface ThumbnailMediaPickerProps {
  mediaTokens: string[];
  selectedIndex: number;
  handleThumbnailClick?: (index: number) => void;
  title?: string;
  description?: string;
  badgeLabel?: string;
  cropper?: true;
  showCropButton?: boolean;
  cropArea?: { x: number; y: number; height: number; width: number };
  setCropArea?: (cropArea: {
    x: number;
    y: number;
    height: number;
    width: number;
  }) => void;
  stepNumber?: number;
  onUploadClick?: () => void;
  onSelectedMediaChange?: (media: any) => void;
  uploadFocusPoint?: boolean;
  uploadButtonText?: string;
  showThumbnails?: boolean;
  showUploadButton?: boolean;
  showStep?: boolean;
  stepAlwaysOnTop?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  showRemoveButton?: boolean;
  onRemoveMedia?: () => void;
}

interface MediaData {
  [key: string]: MediaFile | undefined;
}

const ThumbnailMediaPicker: React.FC<ThumbnailMediaPickerProps> = React.memo(
  ({
    selectedIndex,
    handleThumbnailClick,
    badgeLabel = "Media",
    title = "Select Source",
    description = "This image or video is what the final video will look like.",
    cropper = false,
    cropArea,
    setCropArea,
    mediaTokens,
    showCropButton = true,
    stepNumber,
    onUploadClick,
    onSelectedMediaChange,
    uploadFocusPoint,
    uploadButtonText = "Upload your own media",
    showThumbnails = true,
    showUploadButton = true,
    showStep = true,
    stepAlwaysOnTop = false,
    videoRef,
    showRemoveButton = false,
    onRemoveMedia,
  }) => {
    const [isCropping, setIsCropping] = useState(false);
    const [mediaData, setMediaData] = useState<{ [key: string]: any }>({});
    const [isLoadingMedia, setIsLoadingUserMedia] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 8;
    const [resetTrigger, setResetTrigger] = useState<number>(0);
    const { loggedIn } = useSession();
    const { t } = useLocalize("LivePortrait");

    useEffect(() => {
      const fetchMediaData = async () => {
        setIsLoadingUserMedia(true);
        const mediaDataPromises = mediaTokens.map(async token => {
          const response = await GetMedia(token, {});
          return { token, media: response.media_file };
        });

        const mediaDataArray = await Promise.all(mediaDataPromises);
        const mediaDataObject = mediaDataArray.reduce(
          (acc, { token, media }) => {
            acc[token] = media;
            return acc;
          },
          {} as MediaData
        );

        setMediaData(mediaDataObject);
        setIsLoadingUserMedia(false);
      };

      fetchMediaData();
    }, [mediaTokens]);

    useEffect(() => {
      // Automatically change to the last page when mediaTokens change
      setCurrentPage(Math.ceil(mediaTokens.length / itemsPerPage) - 1);
    }, [mediaTokens]);

    useEffect(() => {
      // Update the reset trigger whenever selectedIndex changes
      setResetTrigger(prev => prev + 1);
    }, [selectedIndex]);

    const selectedMedia = mediaData[mediaTokens[selectedIndex]];

    const { mainURL } = MediaLinks(selectedMedia?.media_links);

    useEffect(() => {
      if (onSelectedMediaChange) {
        onSelectedMediaChange(selectedMedia);
      }
    }, [selectedMedia, onSelectedMediaChange]);

    const onCropComplete = useCallback(
      (_croppedArea: Area, croppedAreaPixels: Area) => {
        if (setCropArea) {
          setCropArea({
            x: croppedAreaPixels.x,
            y: croppedAreaPixels.y,
            width: croppedAreaPixels.width,
            height: croppedAreaPixels.height,
          });
        }
      },
      [setCropArea]
    );

    const handleNextPage = () => {
      setCurrentPage(prevPage =>
        Math.min(prevPage + 1, Math.ceil(mediaTokens.length / itemsPerPage) - 1)
      );
    };

    const handlePreviousPage = () => {
      setCurrentPage(prevPage => Math.max(prevPage - 1, 0));
    };

    const paginatedMediaTokens = mediaTokens.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    );

    return (
      <div className="d-flex gap-3 flex-column w-100 h-100">
        <div
          className={`lp-media order-4 ${stepAlwaysOnTop ? "" : "order-lg-1"}`}
        >
          {showRemoveButton && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                zIndex: 10,
              }}
            >
              <button onClick={onRemoveMedia} className="ls-remove-audio-btn">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          <div className="lp-tag">
            <div>
              {!isCropping ? (
                <Badge label={badgeLabel} color="ultramarine" overlay={true} />
              ) : (
                <Badge
                  label={
                    isMobile ? t("badge.cropMobile") : t("badge.cropDesktop")
                  }
                  color="gray"
                  overlay={true}
                />
              )}
            </div>
            {cropper && showCropButton && (
              <div>
                <Button
                  label={isCropping ? t("button.done") : t("button.cropFace")}
                  className="py-1 px-2 fs-7"
                  variant={isCropping ? "primary" : "action"}
                  onClick={() => setIsCropping(prev => !prev)}
                />
              </div>
            )}
          </div>

          {cropper && cropArea ? (
            <>
              {mainURL ? (
                <FaceCropper
                  videoSrc={mainURL}
                  onCropComplete={onCropComplete}
                  showGrid={isCropping ? true : false}
                  zoomWithScroll={isCropping ? true : false}
                  isCropping={isCropping}
                  mediaProps={{
                    autoPlay: true,
                    loop: true,
                    controls: false,
                    playsInline: true,
                  }}
                  resetTrigger={resetTrigger}
                />
              ) : (
                <LoadingSpinner padding={false} />
              )}
            </>
          ) : (
            <div className="w-100 h-100 object-fit-contain d-flex align-items-center justify-content-center">
              {isLoadingMedia ? (
                <LoadingSpinner />
              ) : (
                <>
                  {mainURL ? (
                    selectedMedia?.media_type === "image" ? (
                      <img
                        key={selectedIndex}
                        src={mainURL}
                        alt="Selected media"
                      />
                    ) : (
                      <video
                        key={selectedIndex}
                        ref={videoRef}
                        autoPlay={true}
                        muted
                        loop={true}
                        playsInline
                        controls={true}
                        preload="auto"
                        draggable="false"
                      >
                        <source src={mainURL} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <LoadingSpinner padding={false} />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {showStep && (
          <div
            className={`order-1 ${stepAlwaysOnTop ? "" : "order-lg-2"}`.trim()}
          >
            <div className="d-flex gap-2 align-items-center mb-1">
              {stepNumber && <div className="lp-step">{stepNumber}</div>}
              <h2 className="fs-5 mb-0 fw-semibold">{title}</h2>
            </div>

            <p className="fw-medium fs-7 opacity-75">{description}</p>
          </div>
        )}

        {showThumbnails && (
          <div className="row g-2 order-2 order-lg-3 position-relative">
            {paginatedMediaTokens.map((token, index) => {
              const media = mediaData[token];
              const { mainURL: itemMainUrl } = MediaLinks(media?.media_links);

              return (
                <ThumbnailItem
                  key={index}
                  index={index + currentPage * itemsPerPage}
                  selectedIndex={selectedIndex}
                  handleThumbnailClick={handleThumbnailClick}
                  poster={itemMainUrl || ""}
                  mediaType={media?.media_type}
                />
              );
            })}

            {mediaTokens.length > itemsPerPage && (
              <div className="thumbnail-pagination">
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  onClick={handlePreviousPage}
                  className="thumbnail-pagination-icon left-arrow"
                />
                <FontAwesomeIcon
                  icon={faChevronRight}
                  onClick={handleNextPage}
                  className="thumbnail-pagination-icon right-arrow"
                />
              </div>
            )}
          </div>
        )}

        {showUploadButton && (
          <Button
            icon={faUpload}
            label={uploadButtonText}
            variant="action"
            className="order-3 order-lg-4"
            onClick={onUploadClick}
            focusPoint={uploadFocusPoint}
            disabled={!loggedIn}
          />
        )}
      </div>
    );
  }
);

export default ThumbnailMediaPicker;
