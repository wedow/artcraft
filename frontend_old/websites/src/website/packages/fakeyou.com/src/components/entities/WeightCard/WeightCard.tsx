import React from "react";
// import moment from "moment";
import { MakeRatingsProps } from "hooks/useRatings";
import WeightCoverImage from "components/common/WeightCoverImage";
import CardBadge from "../CardBadge";
import CardFooter from "../CardFooter";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import useWeightTypeInfo from "hooks/useWeightTypeInfo";
import { WeightType } from "@storyteller/components/src/api/_common/enums";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp, faWaveformLines } from "@fortawesome/pro-solid-svg-icons";
import Stat from "components/common/Stat/Stat";
import {
  LanguageLabels,
  LanguageTag,
} from "@storyteller/components/src/api/Languages";

interface Props {
  data: any;
  makeRatingsProps?: MakeRatingsProps;
  showCover?: boolean;
  showCreator?: boolean;
}

export default function WeightCard({
  data,
  makeRatingsProps,
  showCover = true,
  showCreator,
}: Props) {
  const {
    cover_image,
    // created_at,
    details,
    maybe_creator,
    creator,
    title,
    token,
    weight_type,
  } = data || {};
  // const timeCreated = moment(created_at || "").fromNow();
  const bucketConfig = new BucketConfig();
  let coverImage = undefined;
  if (cover_image) {
    if (cover_image?.maybe_cover_image_public_bucket_path) {
      coverImage = bucketConfig.getCdnUrl(
        data.cover_image.maybe_cover_image_public_bucket_path,
        110,
        100
      );
    } else if (
      details?.maybe_weight_data?.maybe_cover_image_public_bucket_path
    ) {
      coverImage = bucketConfig.getCdnUrl(
        details?.maybe_weight_data?.maybe_cover_image_public_bucket_path,
        110,
        100
      );
    }
  }

  const weightTypeInfo = useWeightTypeInfo(weight_type || WeightType.NONE);
  const { label: weightType, color: weightTagColor } = weightTypeInfo;

  const languageLabel =
    LanguageLabels[data?.maybe_ietf_primary_language_subtag as LanguageTag] ||
    "-";

  return (
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
            <div className="d-flex flex-column flex-grow-1">
              <h6 className="fw-semibold text-white mb-1">
                {title || details.maybe_weight_data.title}
              </h6>
              {/* <p className="fs-7 opacity-75">{timeCreated}</p> */}
              <CardFooter
                {...{
                  creator: maybe_creator || creator,
                  entityToken: token,
                  entityType: "media_file",
                  makeRatingsProps,
                  showCreator: true,
                  showDivider: false,
                  creatorLink: false,
                  showGravatar: false,
                }}
              />
              <div className="d-flex flex-grow-1 align-items-center gap-1 mt-1">
                <CardBadge
                  className={`fy-entity-type-${weight_type || ""}`}
                  label={weightType || ""}
                  small={true}
                  color={weightTagColor || ""}
                />

                {data?.maybe_ietf_primary_language_subtag && (
                  <CardBadge label={languageLabel} small={true} color="gray" />
                )}
              </div>
              <div className="d-flex gap-2 align-items-center mt-2">
                <div className="opacity-50">
                  <Stat count={data?.usage_count} icon={faWaveformLines} />
                </div>

                <span className="d-flex align-items-center gap-1 fs-7 opacity-50">
                  <FontAwesomeIcon icon={faThumbsUp} />
                  {data?.stats?.positive_rating_count}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          className="position-absolute fs-7 fw-medium fy-select-voice"
          style={{ bottom: "14px", right: "14px" }}
        >
          Use
        </div>
      </div>
    </>
  );
}
