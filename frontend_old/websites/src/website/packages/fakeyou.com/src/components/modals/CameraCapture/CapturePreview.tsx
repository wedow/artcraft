import React from "react";
import { a, SpringValues } from "@react-spring/web";
import { Button } from "components/common";

interface CapturePreviewProps {
  blob: Blob | null;
  resetCapture: () => void;
  style: SpringValues;
  upload: () => void;
}

export default function CapturePreview({
  blob,
  resetCapture,
  style,
  upload,
}: CapturePreviewProps) {
  if (blob) {
    const url = URL.createObjectURL(blob);

    return (
      <a.div {...{ className: "fy-camera-capture-slide", style }}>
        <video
          controls
          playsInline
          {...{
            // onClick,
            // onPlay: () => isPlayingSet(true),
            // onPause: () => isPlayingSet(false),
            className: "fy-camera-capture-preview",
            src: url,
          }}
        />
        <div
          {...{
            className: `fy-camera-capture-preview-actions`,
          }}
        >
          <Button
            {...{
              className: "fy-camera-capture-float-button",
              label: "Try again",
              onClick: () => resetCapture(),
              variant: "secondary",
            }}
          />
          <Button
            {...{
              className: "fy-camera-capture-float-button",
              label: "Upload and use",
              variant: "primary",
              onClick: upload,
            }}
          />
        </div>
      </a.div>
    );
  } else return null;
}
