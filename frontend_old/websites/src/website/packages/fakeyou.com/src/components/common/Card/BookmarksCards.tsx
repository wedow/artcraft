import React from "react";
import MediaCards from "components/common/Card/MediaCards";
import WeightsCards from "components/common/Card/WeightsCards";

interface Props {
  entityType: string;
  props: any;
  type: string;
}

export default function BookmarksCards({ entityType, props, type }: Props) {
  return entityType === "media_file" ?
    <MediaCards { ...{ props, type }} /> : <WeightsCards { ...{ props, type }} />;
}
