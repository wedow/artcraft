import React from "react";
import { Link, useHistory } from "react-router-dom";
import Card from "../Card";
import { CardFooter } from "components/entities";
import useTimeAgo from "hooks/useTimeAgo";
import Badge from "components/common/Badge";
import Button from "components/common/Button";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import useWeightTypeInfo from "hooks/useWeightTypeInfo/useWeightTypeInfo";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import {
  // MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
// import useToken from "hooks/useToken";
import getCardUrl from "../getCardUrl";

interface ImageCardProps {
  bookmarks?: any;
  data: any;
  ratings?: any;
  showCreator?: boolean;
  source?: string;
  type: "media" | "weights";
  inSelectModal?: boolean;
  onResultSelect?: (data: { token: string; title: string }) => void;
  onResultBookmarkSelect?: (data: { token: string; title: string }) => void;
}

export default function ImageCard({
  bookmarks,
  data,
  showCreator,
  source = "",
  ratings,
  type,
  inSelectModal = false,
  onResultSelect,
  onResultBookmarkSelect,
}: ImageCardProps) {
  const history = useHistory();
  // const { setToken, setWeightTitle } = useToken();
  const linkUrl = getCardUrl(data, source, type);

  const { imageThumb } = MediaLinks(
    data.media_links || data.details?.maybe_media_file_data?.media_links
  );

  const handleSelectModalResultSelect = () => {
    console.log("handleSelectModalResultSelect");
    if (inSelectModal) {
      onResultSelect &&
        onResultSelect({
          token: data.weight_token,
          title: data.title,
        });

      onResultBookmarkSelect &&
        onResultBookmarkSelect({
          token: data.details.entity_token,
          title: data.details.maybe_weight_data.title,
        });
    }
  };

  const timeAgo = useTimeAgo(data.created_at);

  const { label: weightBadgeLabel, color: weightBadgeColor } =
    useWeightTypeInfo(
      data.weight_type || data.details?.maybe_weight_data?.weight_type
    );

  const bucketConfig = new BucketConfig();
  let coverImage = "";

  if (imageThumb && type === "media") {
    coverImage = imageThumb(600);
  } else if (type === "weights") {
    coverImage = `/images/default-covers/${
      data?.cover_image?.default_cover.image_index || 0
    }.webp`;
    if (data?.cover_image?.maybe_cover_image_public_bucket_path) {
      coverImage = bucketConfig.getCdnUrl(
        data.cover_image.maybe_cover_image_public_bucket_path,
        600,
        100
      );
    }
    if (data.details?.maybe_weight_data?.maybe_cover_image_public_bucket_path) {
      coverImage = bucketConfig.getCdnUrl(
        data.details?.maybe_weight_data?.maybe_cover_image_public_bucket_path,
        600,
        100
      );
    }
  }

  const card = (
    <Card
      padding={false}
      canHover={true}
      onClick={handleSelectModalResultSelect}
    >
      {type === "media" && (
        <>
          <img src={coverImage} alt={data.weight_name} className="card-img" />
          <div className="card-img-overlay">
            <div className="card-img-gradient" />

            <div className="d-flex align-items-center">
              <div className="d-flex flex-grow-1">
                <Badge label="Image" color="ultramarine" overlay={true} />
              </div>
              {inSelectModal && (
                <Button
                  icon={faArrowRight}
                  iconFlip={true}
                  variant="link"
                  label="Select"
                  className="fs-7"
                  onClick={handleSelectModalResultSelect}
                />
              )}
            </div>

            <div className="card-img-overlay-text">
              <div>
                <p className="fs-7 opacity-75 mb-0">{timeAgo}</p>
              </div>
              <CardFooter
                {...{
                  creator:
                    data?.maybe_creator ||
                    data.details?.maybe_media_file_data?.maybe_creator,
                  entityToken: data.details?.entity_token || data.token,
                  entityType: "media_file",
                  makeBookmarksProps: bookmarks?.makeProps,
                  makeRatingsProps: ratings?.makeProps,
                  showCreator,
                }}
              />
            </div>
          </div>
        </>
      )}

      {type === "weights" && (
        <>
          <img src={coverImage} alt={data.title} className="card-img" />
          <div className="card-img-overlay">
            <div className="card-img-gradient" />
            <div className="d-flex align-items-center">
              <div className="d-flex flex-grow-1">
                <Badge
                  label={weightBadgeLabel}
                  color={weightBadgeColor}
                  overlay={true}
                />
              </div>
              {inSelectModal ? (
                <Button
                  icon={faArrowRight}
                  iconFlip={true}
                  variant="link"
                  label="Select"
                  className="fs-7"
                  onClick={handleSelectModalResultSelect}
                />
              ) : (
                <Button
                  icon={faArrowRight}
                  iconFlip={true}
                  variant="link"
                  label="Use"
                  className="fs-7"
                  onClick={() => {
                    history.push(linkUrl);
                  }}
                />
              )}
            </div>

            <div className="card-img-overlay-text">
              <div className="d-flex align-items-center mt-3">
                <div className="flex-grow-1">
                  <h6 className="fw-semibold text-white mb-1">
                    {data.title || data.details?.maybe_weight_data?.title}
                  </h6>
                  <p className="fs-7 opacity-75 mb-0">{timeAgo}</p>
                </div>
              </div>
              <CardFooter
                {...{
                  creator:
                    data.creator ||
                    data.details.maybe_weight_data?.maybe_creator,
                  entityToken: data.weight_token || data.details?.entity_token,
                  entityType: "model_weight",
                  makeBookmarksProps: bookmarks?.makeProps,
                  makeRatingsProps: ratings?.makeProps,
                  showCreator,
                }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );

  return (
    <>
      {inSelectModal ? (
        <>{card}</>
      ) : (
        <Link
          {...{
            to: linkUrl,
          }}
        >
          {card}
        </Link>
      )}
    </>
  );
}
