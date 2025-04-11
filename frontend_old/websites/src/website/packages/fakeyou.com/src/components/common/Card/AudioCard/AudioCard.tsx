import React from "react";
import { Link } from "react-router-dom";
import Card from "../Card";
import AudioPlayer from "components/common/AudioPlayer";
import useTimeAgo from "hooks/useTimeAgo";
import { CardFooter } from "components/entities";
import Badge from "components/common/Badge";
import { faThumbsUp, faWaveformLines } from "@fortawesome/pro-solid-svg-icons";
import useWeightTypeInfo from "hooks/useWeightTypeInfo/useWeightTypeInfo";
import getCardUrl from "../getCardUrl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Stat from "components/common/Stat/Stat";
import WeightCoverImage from "components/common/WeightCoverImage";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import {
  // MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import {
  LanguageLabels,
  LanguageTag,
} from "@storyteller/components/src/api/Languages";
// import getCardUrl from "../getCardUrl";

interface AudioCardProps {
  bookmarks?: any;
  data: any;
  ratings?: any;
  showCreator?: boolean;
  showCover?: boolean;
  source?: string;
  type: "media" | "weights";
  inSelectModal?: boolean;
  onResultSelect?: (data: any) => void;
  onResultBookmarkSelect?: (data: any) => void;
  // onClick?: (e:any) => any;
}

export default function AudioCard({
  bookmarks,
  data,
  ratings,
  showCreator,
  showCover,
  source = "",
  type,
  inSelectModal = false,
  // onClick: inClick,
  onResultSelect,
  onResultBookmarkSelect,
}: AudioCardProps) {
  const { mainURL } = MediaLinks(data.media_links);
  const linkUrl = getCardUrl(data, source, type);

  const coverImage = data.maybe_cover_image_public_bucket_path
    ? new BucketConfig().getCdnUrl(
        data.maybe_cover_image_public_bucket_path,
        110,
        100
      )
    : "";

  const handleSelectModalResultSelect = () => {
    if (inSelectModal) {
      onResultSelect && onResultSelect(data);

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

  const languageLabel =
    LanguageLabels[data?.maybe_ietf_primary_language_subtag as LanguageTag] ||
    "-";

  const card = (
    <Card
      padding={true}
      canHover={true}
      onClick={handleSelectModalResultSelect}
    >
      {type === "media" && (
        <>
          <div className="mb-3">
            <div className="d-flex align-items-center">
              <div className="d-flex flex-grow-1 align-items-center gap-2">
                <Badge
                  {...{ className: "fy-entity-type-audio", label: "Audio" }}
                />
              </div>
            </div>

            <h6 className="fw-semibold text-white mb-1 mt-3">
              {data.origin?.maybe_model
                ? data.origin.maybe_model.title
                : "Media Audio"}
            </h6>
            <p className="fs-7 opacity-75">{timeAgo}</p>
            {data.maybe_text_transcript && (
              <p className="fs-7 mt-2 two-line-ellipsis">
                {data.maybe_text_transcript}
              </p>
            )}
          </div>
          {mainURL && <AudioPlayer src={mainURL} id={data.token} />}
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
        </>
      )}

      {type === "weights" && (
        <>
          <div className="d-flex">
            {showCover && (
              <WeightCoverImage
                src={coverImage}
                height={110}
                width={110}
                coverIndex={data?.cover_image?.default_cover?.image_index}
              />
            )}
            <div className="flex-grow-1">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="fw-semibold text-white mb-1">
                    {data.title || data?.details?.maybe_weight_data?.title}
                  </h6>
                  {inSelectModal && (
                    <CardFooter
                      {...{
                        creator:
                          data?.creator ||
                          data.details.maybe_weight_data?.maybe_creator,
                        entityToken:
                          data.weight_token || data.details?.entity_token,
                        entityType: "model_weight",
                        makeBookmarksProps: bookmarks?.makeProps,
                        makeRatingsProps: ratings?.makeProps,
                        showCreator: true,
                        showDivider: false,
                        creatorLink: false,
                        showGravatar: false,
                      }}
                    />
                  )}
                  <div className="d-flex flex-grow-1 align-items-center gap-1 mt-1">
                    <Badge
                      small={true}
                      label={weightBadgeLabel}
                      color={weightBadgeColor}
                    />

                    {data?.maybe_ietf_primary_language_subtag && (
                      <Badge label={languageLabel} small={true} color="gray" />
                    )}
                  </div>
                  <div className="d-flex gap-2 align-items-center mt-2">
                    {data.usage_count && (
                      <div className="opacity-50">
                        <Stat
                          count={data?.usage_count}
                          icon={faWaveformLines}
                        />
                      </div>
                    )}
                    <span className="d-flex align-items-center gap-1 fs-7 opacity-50 text-white">
                      <FontAwesomeIcon icon={faThumbsUp} />
                      {data?.stats?.positive_rating_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {inSelectModal && (
              <div
                className="position-absolute fs-7 fw-medium fy-select-voice"
                style={{ bottom: "14px", right: "14px" }}
              >
                Use
              </div>
            )}
          </div>
          {!inSelectModal && (
            <CardFooter
              {...{
                creator:
                  data?.creator ||
                  data.details.maybe_weight_data?.maybe_creator,
                entityToken: data.weight_token || data.details?.entity_token,
                entityType: "model_weight",
                makeBookmarksProps: bookmarks?.makeProps,
                makeRatingsProps: ratings?.makeProps,
                showCreator: true,
                inSelectModal,
                showUseButton: true,
              }}
            />
          )}
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
