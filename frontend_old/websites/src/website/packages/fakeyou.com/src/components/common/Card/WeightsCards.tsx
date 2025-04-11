import React from "react";
import AudioCard from "./AudioCard";
import ImageCard from "./ImageCard";
import { WeightCategory } from "@storyteller/components/src/api/_common/enums/WeightCategory";

interface Props {
  props: any;
  type: string;
  inSelectModal?: boolean;
  onResultSelect?: (data: any) => void;
}

export default function WeightsCards({
  props,
  type,
  inSelectModal,
  onResultSelect,
}: Props) {
  switch (type) {
    case WeightCategory.TTS:
    case WeightCategory.VC:
    case WeightCategory.ZS:
      return (
        <AudioCard
          {...props}
          showCover
          inSelectModal={inSelectModal}
          onResultSelect={onResultSelect}
        />
      );
    case WeightCategory.SD:
    case WeightCategory.WF:
      return <ImageCard {...props} />;
    default:
      return <div>Unsupported weight type</div>;
  }
}
