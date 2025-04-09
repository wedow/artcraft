import React from "react";
import { SlideProps } from "./EntityInput";
import {
  useCameraState,
  // useMediaUploader,
  useModal,
  useSession,
} from "hooks";
import {
  CameraCapture,
  MediaBrowser,
  MediaBrowserProps,
} from "components/modals";
import { FileWrapper } from "components/common";
import {
  AcceptTypes,
  EntityInputMode,
  EntityModeProp,
  getMediaTypesByCategory,
  isSelectedType,
  mediaCategoryfromString,
  MediaFilters,
} from "components/entities/EntityTypes";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faDiagramSankey,
  faFile,
  faFileArrowUp,
  faGrid,
  faImage,
  faPersonWalking,
  faWaveform,
} from "@fortawesome/pro-solid-svg-icons";

interface EmptySlideProps extends SlideProps {
  accept: AcceptTypes | AcceptTypes[];
  inputProps?: any;
  queryUser?: string;
  selectToken: (token: string) => void;
  showWebcam: boolean;
  type: EntityModeProp;
}

export default function EntityInputEmpty({
  accept,
  GApage,
  inputProps,
  queryUser,
  selectToken,
  showWebcam,
  type,
  ...rest
}: EmptySlideProps) {
  const { open } = useModal();
  const { user } = useSession();
  const camera = useCameraState();

  const accepted = Array.isArray(accept) ? accept : [accept];
  const inputMode = EntityInputMode[type];
  const isMedia = inputMode === EntityInputMode.media;
  const fileTypes = isMedia
    ? accepted
        .map((mediaCategory, i) => {
          return mediaCategory
            ? getMediaTypesByCategory(mediaCategoryfromString(mediaCategory))
            : [];
        })
        .flat()
    : [];

  const props: MediaBrowserProps = {
    accept: accepted,
    inputMode,
    username: queryUser || user?.username || "",
    ...rest,
  };

  const browserClick = () =>
    open({
      component: MediaBrowser,
      props,
    });

  const cameraClick = () =>
    open({
      component: CameraCapture,
      padding: false,
      props: {
        camera,
        GApage,
        selectToken,
      },
      width: "square",
    });

  const mediaIcons = () => {
    if (isSelectedType(MediaFilters.audio, accepted[0])) return faWaveform;
    if (isSelectedType(MediaFilters.engine_asset, accepted[0]))
      return faPersonWalking;
    if (isSelectedType(MediaFilters.image, accepted[0])) return faImage;
    if (isSelectedType(MediaFilters.video, accepted[0])) return faFile;
    return faFile;
  };

  const supported = `${
    fileTypes.length ? fileTypes.join(", ") : fileTypes[0]
  } files supported`;

  return (
    <>
      <Icon
        {...{
          className: "fy-entity-input-icon",
          icon: [faFile, mediaIcons(), faDiagramSankey, mediaIcons()][
            inputMode
          ],
        }}
      />
      <div {...{ className: "fy-entity-input-empty-controls" }}>
        {isMedia && (
          <FileWrapper
            {...{
              containerClass: "fy-entity-input-row",
              fileTypes,
              panelClass: "fy-entity-input-button",
              noStyle: true,
              ...inputProps,
            }}
          >
            <>
              <Icon
                {...{
                  className: "fy-entity-input-label-icon",
                  icon: faFileArrowUp,
                }}
              />
              <div {...{ className: "fy-entity-input-upload-detail" }}>
                Upload, click or drag here
                {accept && <span>{supported}</span>}
              </div>
            </>
          </FileWrapper>
        )}
        <div
          {...{
            className: "fy-entity-input-row fy-entity-input-button",
            onClick: browserClick,
          }}
        >
          <Icon
            {...{ className: "fy-entity-input-label-icon", icon: faGrid }}
          />
          Choose from your {["bookmarks", "media", "weights"][inputMode]}
        </div>
        {showWebcam && (
          <div
            {...{
              className: "fy-entity-input-row fy-entity-input-button",
              onClick: cameraClick,
            }}
          >
            <Icon
              {...{ className: "fy-entity-input-label-icon", icon: faCamera }}
            />
            Record with your camera
          </div>
        )}
      </div>
    </>
  );
}
