import React, { useState } from "react";
import { a, TransitionFn, useTransition } from "@react-spring/web";
import { WorkIndicator } from "components/svg";
import { CameraState, useCameraState, useMediaUploader } from "hooks";
import { UploaderResponse } from "components/entities/EntityTypes";
import {
  Camera,
  Button,
  ModalUtilities,
  RecordToggle,
  Spinner,
  SegmentButtons,
} from "components/common";
import { faClose } from "@fortawesome/pro-solid-svg-icons";
import { isMobile } from "react-device-detect";
import CapturePreview from "./CapturePreview";
import "./CameraCapture.scss";

interface CameraCaptureProps extends ModalUtilities {
  autoCapture?: boolean;
  camera: CameraState;
  GApage?: string;
  selectToken: (token: string) => void;
}

export default function CameraCapture({
  autoCapture,
  handleClose,
  GApage,
  selectToken,
}: CameraCaptureProps) {
  const [cameraPosition, cameraPositionSet] = useState("user");

  const camera = useCameraState(autoCapture);

  const {
    busy: uploaderBusy,
    createUpload,
    error: uploaderError,
    uploadProgress,
  } = useMediaUploader({
    onError: () => {
      // @ts-ignore
      window.dataLayer.push({
        event: "upload_failure_webcam",
        page: GApage || "/",
        user_id: "$user_id",
      });
    },
    onSuccess: (res: UploaderResponse) => {
      handleClose();
      selectToken(res.media_file_token);
    },
  });

  const index = uploaderError
    ? 3
    : uploaderBusy
      ? 2
      : camera.blob && !camera.capturing
        ? 1
        : 0;

  const upload = () => {
    if (camera.blob) {
      const file = new File([camera.blob], "test-upload.mp4", {
        type: "video/mp4",
      });
      createUpload(file);
    }
  };

  const transitions: TransitionFn<
    number,
    { opacity: number; transform: string }
  > = useTransition(index, {
    config: { mass: 1, tension: 80, friction: 10 },
    from: { opacity: 0, transform: `translateX(${5}rem)` },
    enter: { opacity: 1, transform: `translateX(0)` },
    leave: { opacity: 0, transform: `translateX(${5}rem)` },
  });

  const cameraOptions = [
    { label: "Selfie camera", value: "user" },
    { label: "Rear camera", value: "enviroment" },
  ];

  return (
    <div
      {...{
        className: "fy-camera-capture-modal",
      }}
    >
      <Button
        {...{
          className: "fy-camera-capture-close",
          icon: faClose,
          onClick: () => handleClose(),
          square: true,
        }}
      />
      {transitions((style: any, i: number) => {
        return [
          <a.div {...{ className: "fy-camera-capture-slide", style }}>
            <Camera
              {...{
                // muted: true,
                className: "fy-camera-capture-display",
                onUserMedia: () => camera.startedSet(true),
                cameraPosition,
                cameraRef: camera.ref,
              }}
            />
            {camera.started ? (
              <div {...{ className: "fy-camera-capture-controls" }}>
                <RecordToggle
                  {...{
                    className: "fy-camera-input-toggle",
                    counter: camera.counter,
                    value: camera.capturing,
                    onChange: camera.toggle,
                  }}
                />
                {isMobile && (
                  <SegmentButtons
                    {...{
                      value: cameraPosition,
                      onChange: ({ target }: { target: { value: string } }) =>
                        cameraPositionSet(target.value),
                      options: cameraOptions,
                    }}
                  />
                )}
              </div>
            ) : (
              <div {...{ className: "fy-camera-capture-centered" }}>
                <Spinner />
              </div>
            )}
          </a.div>,

          <CapturePreview
            {...{
              blob: camera.blob,
              resetCapture: camera.reset,
              style,
              upload,
            }}
          />,
          <a.div
            {...{
              className: "fy-camera-capture-slide fy-camera-capture-centered",
              style,
            }}
          >
            <WorkIndicator
              {...{
                failure: false,
                label: "Uploading",
                max: 100,
                progressPercentage: uploadProgress,
                stage: 1,
                showPercentage: true,
                success: false,
              }}
            />
          </a.div>,
          <a.div
            {...{
              className: "fy-camera-capture-slide fy-camera-capture-centered",
              style,
            }}
          >
            error
          </a.div>,
        ][i];
      })}
    </div>
  );
}
