import React, { useState } from "react";
import { a, TransitionFn, useTransition } from "@react-spring/web";
import { useCameraState, useMedia, useModal } from "hooks";
import { CameraCapture } from "components/modals";
import { Camera, Button, RecordToggle } from "components/common";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCameraSlash } from "@fortawesome/pro-solid-svg-icons";
import "./CameraInput.scss";

export interface CameraInputEvent {
  target: {
    value: string;
  };
}

interface CameraInputProps {
  GApage?: string;
  onChange?: (e: CameraInputEvent) => void;
  value?: any;
}

export default function CameraInput({
  GApage = "/",
  onChange,
  value,
}: CameraInputProps) {
  const { open } = useModal();
  const camera = useCameraState(true);
  const [token, tokenSet] = useState("");
  const { links } = useMedia({ mediaToken: token });
  const cameraSupported = MediaRecorder.isTypeSupported("video/mp4");

  const cameraClick = () =>
    open({
      component: CameraCapture,
      padding: false,
      props: {
        autoCapture: true,
        camera,
        GApage,
        selectToken: (token: string) => {
          if (onChange) {
            tokenSet(token);
            onChange({ target: { value: token } });
          }
        },
      },
      width: "square",
    });

  const transitions: TransitionFn<
    boolean,
    { opacity: number; transform: string }
  > = useTransition(!!token, {
    config: { mass: 1, tension: 80, friction: 10 },
    from: { opacity: 0, transform: `translateX(${5}rem)` },
    enter: { opacity: 1, transform: `translateX(0)` },
    leave: { opacity: 0, transform: `translateX(${5}rem)` },
  });

  const reset = () => {
    cameraClick();
    tokenSet("");
  };

  return (
    <div
      {...{
        className: `fy-camera-input${
          cameraSupported ? "" : " fy-camera-input-unsuported"
        }`,
        ...(cameraSupported ? { onClick: cameraClick } : {}),
      }}
    >
      {transitions((style: any, hasToken: boolean) =>
        hasToken ? (
          <a.div
            {...{
              className: "fy-camera-input-preview",
              style,
            }}
          >
            <video
              controls
              {...{
                src: links.mainURL,
              }}
            />
            <Button
              {...{
                className: "fy-camera-input-float-btn",
                label: "Record again",
                onClick: reset,
                small: true,
              }}
            />
          </a.div>
        ) : (
          <a.div
            {...{
              className: "fy-camera-input-preview",
              style,
            }}
          >
            {MediaRecorder.isTypeSupported("video/mp4") ? (
              <>
                <Camera
                  {...{
                    cameraPosition: "user",
                    muted: true,
                    cameraRef: camera.ref,
                  }}
                />
                <div
                  {...{
                    className: "fy-camera-input-toggle-container",
                  }}
                >
                  <RecordToggle
                    {...{
                      className: "fy-camera-input-toggle",
                      value: false,
                    }}
                  />
                </div>
              </>
            ) : (
              <div {...{ className: "fy-webcam-not-supported" }}>
                <FontAwesomeIcon {...{ icon: faCameraSlash }} />
                Sorry, we currently do not support webcam recording in your
                browser.
              </div>
            )}
          </a.div>
        )
      )}
    </div>
  );
}
