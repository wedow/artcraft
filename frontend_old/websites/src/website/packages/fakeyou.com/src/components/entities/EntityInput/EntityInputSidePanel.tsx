import React from "react";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import { Button, ZoomSlider, ZoomSliderOnChangeEvent } from "components/common";

interface Props {
  clear: () => void;
  entityType: "image" | "video";
  isNarrow: boolean;
  media?: MediaFile;
  showCrop: boolean;
  zoom: number;
  zoomSliderChange: (zoom: ZoomSliderOnChangeEvent) => void;
}

export default function EntityInputSidePanel({
  clear,
  entityType,
  isNarrow,
  media,
  showCrop,
  zoomSliderChange,
  zoom,
}: Props) {
  const uploader = `Uploaded by ${
    media?.maybe_creator_user?.display_name || "User"
  }`;
  return (
    <div {...{ className: "fy-entity-input-preview-controls" }}>
      <div {...{ className: `fy-entity-input-preview-tools${ isNarrow ? "-narrow" : "-wide" }` }}>
        {showCrop && (
          <ZoomSlider {...{ ...isNarrow ? {horizontal: true } : {}, onChange: zoomSliderChange, value: zoom }} />
        )}

        <div {...{ className: "fy-entity-input-file-details" }}>
          {media?.maybe_title || `Untitled ${entityType}`}
          <div>{uploader}</div>
        </div>
      </div>
      <Button
        {...{
          label: `Choose another ${entityType}`,
          variant: "secondary",
          onClick: () => clear(),
        }}
      />
    </div>
  );
}
