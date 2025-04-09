import React from "react";
import { MediaFileClass } from "@storyteller/components/src/api";

import { a, TransitionFn, useTransition } from "@react-spring/web";
import {
  MediaFile,
  MediaLinkUtility,
} from "@storyteller/components/src/api/media_files";

interface JobResultPreviewProps {
  hover: boolean;
  links: MediaLinkUtility;
  mediaFile: MediaFile;
  show?: boolean;
}

export default function JobResultPreview({
  hover,
  links,
  mediaFile,
  show,
}: JobResultPreviewProps) {
  const transitions: TransitionFn<boolean, { opacity: number }> = useTransition(
    hover,
    {
      config: { mass: 1, tension: 80, friction: 10 },
      from: { opacity: 0 },
      enter: { opacity: 1 },
      leave: { opacity: 0 },
    }
  );

  const previewSwitch = () => {
    switch (mediaFile?.media_class) {
      case MediaFileClass.Image:
        return <div>Image</div>;
      case MediaFileClass.Video:
        return (
          <div {...{ className: "fy-inference-job-preview-thumb" }}>
            <a.img
              {...{
                className: "fy-inference-job-preview-static",
                src: links.videoStill ? links.videoStill(100) : "",
              }}
            />
            {transitions((style, isHovering) =>
              isHovering ? (
                <a.img
                  {...{
                    className: "fy-inference-job-preview-gif",
                    src: links.videoAnimated ? links.videoAnimated(100) : "",
                    style,
                  }}
                />
              ) : null
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return show ? (
    <div {...{ className: "fy-inference-job-preview" }}>{previewSwitch()}</div>
  ) : null;
}
