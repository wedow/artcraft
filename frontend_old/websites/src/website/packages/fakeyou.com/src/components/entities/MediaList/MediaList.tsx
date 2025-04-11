import React, { useRef } from "react";
import { MediaFile } from "@storyteller/components/src/api/media_files/GetMedia";
import MasonryGrid from "components/common/MasonryGrid/MasonryGrid";
import { ImagePreview, MocapPreview, VideoPreview } from "../CardPreviews";
import {
  AudioCard,
  OverlayCard,
  CardWrapper,
  WeightCard,
} from "components/entities";
import { EntityType } from "components/entities/EntityTypes";

interface MediaCardsProps {
  props: any;
  type: string;
  featured?: boolean;
}

interface Props {
  entityType: EntityType;
  list: MediaFile[];
  success?: boolean;
  emptyContent?: React.ReactNode;
}

const Cards = ({ props, type, featured }: MediaCardsProps) => {
  switch (type) {
    case "audio":
      return (
        <CardWrapper
          {...{ ...props, card: AudioCard, padding: true, featured }}
        />
      );
    case "gif":
    case "image":
    case "jpg":
      return (
        <CardWrapper
          {...{ ...props, card: OverlayCard, preview: ImagePreview, featured }}
        />
      );
    case "mp4":
    case "video":
      return (
        <CardWrapper
          {...{ ...props, card: OverlayCard, preview: VideoPreview, featured }}
        />
      );
    case "bvh":
    case "glb":
    case "gltf":
    case "scene_ron":
      return (
        <CardWrapper
          {...{ ...props, card: OverlayCard, preview: MocapPreview, featured }}
        />
      );
    case "rvc_v2":
    case "so_vits_svc":
      return (
        <CardWrapper
          {...{ ...props, card: WeightCard, padding: true, featured }}
        />
      );
    case "tt2":
    case "tacotron2.5":
    case "gpt_so_vits":
      return (
        <CardWrapper
          {...{ ...props, card: WeightCard, padding: true, featured }}
        />
      );
    default:
      return <div>Unsupported type</div>;
  }
};

export default function MediaList({
  entityType,
  list,
  success,
  emptyContent,
  ...rest
}: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  return list.length === 0 && success ? (
    <>
      {emptyContent ? (
        emptyContent
      ) : (
        <div className="text-center mt-4 opacity-75">No media created yet.</div>
      )}
    </>
  ) : (
    <MasonryGrid {...{ gridRef }}>
      {list.map((data: any, key: number) => {
        let props = {
          data,
          type: data.media_type ? "media" : "weight",
          ...rest,
        };
        return (
          <div
            {...{
              className: "col-12 col-sm-6 col-lg-6 col-xl-4 grid-item",
              key,
            }}
          >
            <Cards
              {...{
                type: data.media_type || data.weight_type,
                props,
                featured: data.is_featured,
              }}
            />
            {
              // [ null,
              //   <MediaCards {...{ type: data.media_type, props }} />,
              //   <WeightsCards {...{ type: data.weight_type, props }} />
              // ][entityType]
            }
          </div>
        );
      })}
    </MasonryGrid>
  );
}
