import React, { RefObject } from "react";
import Webcam from "react-webcam";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { faCameraSlash } from "@fortawesome/pro-solid-svg-icons";
import "./Camera.scss";

interface Props {
  cameraPosition?: string;
  cameraRef: RefObject<Webcam>;
  className?: string;
  onUserMedia?: () => void;
}

export default function Camera({
  cameraPosition,
  cameraRef,
  className,
  onUserMedia,
}: Props) {
  return MediaRecorder.isTypeSupported("video/mp4") ? (
    <Webcam
      audio
      {...{
        className,
        muted: true,
        onUserMedia,
        ref: cameraRef,
        videoConstraints: {
          width: 512,
          height: 512,
          facingMode: cameraPosition,
        },
      }}
    />
  ) : (
    <div {...{ className: "fy-webcam-not-supported" }}>
      <Icon {...{ icon: faCameraSlash }} />
      Sorry, we currently do not support webcam recording in your browser.
    </div>
  );
}
