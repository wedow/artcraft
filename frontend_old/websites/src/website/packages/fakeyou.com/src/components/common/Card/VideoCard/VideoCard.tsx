import React from "react";
import Card from "../Card";
import useTimeAgo from "hooks/useTimeAgo";
import {
  faArrowRight,
  // faArrowDownToLine,
} from "@fortawesome/pro-solid-svg-icons";
import Badge from "components/common/Badge";
import Button from "components/common/Button";
import { useHover } from "hooks";
import { Link } from "react-router-dom";
import getCardUrl from "../getCardUrl";
import { STYLES_BY_KEY } from "common/StyleOptions";
import {
  // MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";

interface VideoCardProps {
  bookmarks?: any;
  data: any;
  ratings?: any;
  showCreator?: boolean;
  source?: string;
  type: "media" | "weights";
  inSelectModal?: boolean;
  onResultSelect?: (data: { token: string; title: string }) => void;
}

export default function VideoCard({
  data,
  source = "",
  type,
  inSelectModal = false,
  onResultSelect,
}: VideoCardProps) {
  const linkUrl = getCardUrl(data, source, type);
  const { videoAnimated, videoStill } = MediaLinks(
    data.media_links || data.details.maybe_media_file_data.media_links
  );
  const [hover, hoverProps] = useHover({});

  const handleSelectModalResultSelect = () => {
    if (inSelectModal && onResultSelect) {
      onResultSelect(data);
    }
  };

  const timeAgo = useTimeAgo(data.created_at);

  //video doesnt have random cover image endpoint or thumbnails yet
  const defaultImageUrl = `/images/default-covers/${
    data?.cover_image?.default_cover.image_index || 0
  }.webp`;

  // We are checking the existence of the bucket gif files because it seems as though we can't check the cdn file's existence without running into cors issues
  // CDN URLS
  const staticImageUrl = videoStill && videoStill(600);
  const gifUrl = videoAnimated && videoAnimated(360);

  const styleLabel = STYLES_BY_KEY.has(data.maybe_style_name)
    ? STYLES_BY_KEY.get(data.maybe_style_name)?.label
    : "Unknown Style";

  const getLabel = (data: any) => {
    if (data.origin_product_category === "face_animator") {
      return "Lipsync";
    } else if (data.origin_product_category === "face_mirror") {
      return "Live Portrait";
    } else if (data.origin_product_category === "workflow") {
      return "Workflow";
    } else if (data.origin_product_category === "unknown") {
      return data.origin_category === "upload"
        ? "Upload"
        : data.origin_category;
    } else {
      return data.origin_product_category;
    }
  };

  const productCategory = getLabel(data);

  const card = (
    <Card
      {...{ ...hoverProps }}
      padding={false}
      canHover={true}
      onClick={handleSelectModalResultSelect}
    >
      {type === "media" && (
        <>
          <img
            src={gifUrl && hover ? gifUrl : staticImageUrl || defaultImageUrl}
            alt={data.weight_name}
            className="card-video"
            loading="lazy"
          />
          <div className="card-video-overlay">
            <div className="card-img-gradient" />

            <div className="d-flex align-items-center">
              <div className="d-flex flex-grow-1 gap-2">
                <Badge label="Video" color="purple" overlay={true} />
                <Badge label={productCategory} color="gray" overlay={true} />
                {/*      <Badge
                  className="fy-card-download-badge"
                  icon={faArrowDownToLine}
                  color="primary"
                  overlay={true}
                  to={bucketUrl}
                />*/}
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
                <h6 className="fw-semibold text-white mb-1">
                  {data.maybe_title}
                </h6>
                <p className="fs-7 opacity-75">
                  {timeAgo}
                  <span className="px-2">•</span>
                  {styleLabel}
                </p>
                {/* <CardFooter
                  {...{
                    creator: data?.maybe_creator,
                    entityToken: data.token,
                    entityType: "media_file",
                    makeBookmarksProps: bookmarks?.makeProps,
                    makeRatingsProps: ratings?.makeProps,
                    showCreator,
                  }}
                /> */}
              </div>
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
