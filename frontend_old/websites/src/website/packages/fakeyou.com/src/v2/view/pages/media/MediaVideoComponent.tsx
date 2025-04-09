import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import React from "react";

interface MediaVideoComponentProps {
  mediaFile?: MediaFile;
}

export default function MediaVideoComponent({
  mediaFile,
}: MediaVideoComponentProps) {
  const { mainURL } = MediaLinks(mediaFile?.media_links);

  return mediaFile && mediaFile.public_bucket_path ? (
    <video className="rounded" controls width="100%" height="auto">
      <source src={mainURL} />
      Your browser does not support the video element.
    </video>
  ) : null;
}
