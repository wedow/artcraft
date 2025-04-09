import React from "react";
import { Link } from "react-router-dom";
import Card from "../Card";
import { CardFooter } from "components/entities";
import useTimeAgo from "hooks/useTimeAgo";
import Badge from "components/common/Badge";
import getCardUrl from "../getCardUrl";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";

interface FBXCardProps {
  bookmarks: any;
  data: any;
  ratings: any;
  showCreator?: boolean;
  source?: string;
  type: "media" | "weights";
}

export default function FBXCard({
  bookmarks,
  data,
  showCreator,
  source = "",
  ratings,
  type,
}: FBXCardProps) {
  const linkUrl = getCardUrl(data, source, type);

  const timeAgo = useTimeAgo(data.created_at);

  const bucketConfig = new BucketConfig();

  let coverImage = `/images/default-covers/${
      data?.cover_image?.default_cover.image_index || 0
    }.webp`;

  if (data?.cover_image?.maybe_cover_image_public_bucket_path) {
    coverImage = bucketConfig.getCdnUrl(
      data.cover_image.maybe_cover_image_public_bucket_path,
      600,
      100
    );
  }

  return (
    <Link
      {...{
        to: linkUrl,
      }}
    >
      <Card padding={false} canHover={true}>
        <img src={coverImage} alt={data.maybe_title} className="card-img" />
        <div className="card-img-overlay">
          <div className="card-img-gradient" />

          <div className="d-flex align-items-center">
            <div className="d-flex flex-grow-1">
              <Badge {...{ className: "fy-entity-type-fbx", label: "FBX", overlay: true }}/>
            </div>
          </div>

          <div className="card-img-overlay-text">
            <div>
              <p className="fs-7 opacity-75 mb-0">{timeAgo}</p>
            </div>
            <CardFooter {...{
              creator: data?.maybe_creator || data.details?.maybe_media_file_data?.maybe_creator,
              entityToken: data.details?.entity_token || data.token,
              entityType: "media_file",
              makeBookmarksProps: bookmarks?.makeProps,
              makeRatingsProps: ratings?.makeProps,
              showCreator
            }}/>
          </div>
        </div>
      </Card>
    </Link>
  );
}
