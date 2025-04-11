import React, { useState, forwardRef, memo, useEffect } from "react";
import { useMedia } from "hooks";
import { MediaFile } from "@storyteller/components/src/api";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import makeClass from "resources/makeClass";

import { Label, Spinner } from "components/common";
import "./styles.scss";

export interface VideoFakeyouProps {
  debug?: boolean;
  width?: number | string;
  height?: number | string;
  hideIfNoMedia?: boolean;
  wrapperClassName?: string;
  controls?: boolean;
  muted?: boolean;
  className?: string;
  src?: string;
  mediaToken?: string;
  label?: string;
  onResponse?: (res: any) => void;
}

type Ref = HTMLVideoElement;

const VideoFakeyou = memo(
  forwardRef<Ref, VideoFakeyouProps>(
    (
      {
        debug: propsDebug = false,
        width,
        height,
        hideIfNoMedia = false,
        wrapperClassName,
        controls = true,
        muted,
        className,
        src,
        mediaToken,
        label,
        onResponse,
        ...rest
      }: VideoFakeyouProps,
      ref
    ) => {
      //console.log(`Video Player rerender: ${mediaToken}`);
      const debug = false; // || propsDebug;

      if (debug) console.log("VideoFakeyou reRENDER!!");

      const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
      useEffect(() => {
        setMediaFile(null);
      }, [mediaToken]);

      useMedia({
        mediaToken: mediaToken,
        onSuccess: (res: any) => {
          setMediaFile(res);
          if (onResponse) onResponse(res);
        },
      });

      const mediaLink =
        src ||
        (mediaFile &&
          new BucketConfig().getGcsUrl(mediaFile.public_bucket_path));
      const sizing = {
        height:
          typeof height === "number"
            ? height + "px"
            : typeof height === "string"
              ? height
              : "auto",
        width:
          typeof width === "number"
            ? width + "px"
            : typeof width === "string"
              ? width
              : "auto",
      };
      if (mediaLink) {
        return (
          <div
            style={sizing}
            {...{ ...makeClass("fy-video", wrapperClassName) }}
          >
            {label && <Label label={label} />}
            <video
              controls={controls}
              muted={muted}
              ref={ref}
              key={mediaToken}
              {...{
                ...makeClass("object-fit-contain", className),
                ...rest,
              }}
            >
              <source src={mediaLink} type="video/mp4" />
            </video>
          </div>
        );
      } else if (!hideIfNoMedia) {
        return (
          <div
            style={sizing}
            {...{ ...makeClass("fy-video", wrapperClassName) }}
          >
            <Spinner />
          </div>
        );
      }
      return null;
    }
  )
);

export default VideoFakeyou;
