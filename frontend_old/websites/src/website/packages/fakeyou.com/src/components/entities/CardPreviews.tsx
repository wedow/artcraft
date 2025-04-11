import React from "react";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome"; // for now
import { faPersonWalking } from "@fortawesome/pro-solid-svg-icons";
import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";

export const ImagePreview = ({ data }: { data: MediaFile }) => {
  const { mainURL, imageThumb } = MediaLinks(data.media_links);

  return (
    <img
      {...{
        alt: "",
        className: "card-img",
        src: imageThumb ? imageThumb(600) : mainURL || "",
      }}
    />
  );
};

export const VideoPreview = ({
  data,
  hover,
}: {
  data: MediaFile;
  hover: boolean;
}) => {
  const { videoAnimated, videoStill } = MediaLinks(data.media_links);
  const { default_cover } = data?.cover_image || {};

  //video doesnt have random cover image endpoint or thumbnails yet
  const coverImage = `/images/default-covers/${
    default_cover?.image_index || 0
  }.webp`;

  return (
    <img
      {...{
        alt: "",
        className: "card-video",
        src:
          hover && videoAnimated
            ? videoAnimated(360)
            : videoStill
              ? videoStill(600)
              : coverImage,
      }}
    />
  );
};

export const MocapPreview = () => (
  <Icon {...{ className: "card-img", icon: faPersonWalking }} />
);

// export const ImagePreview = previwImg("card-img");
// export const VideoPreview = previwImg("card-video");
