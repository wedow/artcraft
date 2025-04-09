import { WeightType } from "@storyteller/components/src/api/_common/enums";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import LoadingSpinner from "components/common/LoadingSpinner";
import WeightCoverImage from "components/common/WeightCoverImage";
import { CardBadge } from "components/entities";
import { useWeightFetch } from "hooks";
import useWeightTypeInfo from "hooks/useWeightTypeInfo";
import React, { useState } from "react";

interface FeaturedVoiceProps {
  token: string;
  onClick?: (weight: any) => void;
}

export const FeaturedVoice = ({ token, onClick }: FeaturedVoiceProps) => {
  const weight_token = token;
  const fetchedWeight = useWeightFetch({
    onSuccess: () => setIsLoading(false),
    token: weight_token,
  });

  const { data: weight } = fetchedWeight;

  const bucketConfig = new BucketConfig();

  const weightTypeInfo = useWeightTypeInfo(
    weight?.weight_type || WeightType.NONE
  );
  const { label: weightType, color: weightTagColor } = weightTypeInfo;

  const coverImage = weight?.cover_image?.maybe_cover_image_public_bucket_path
    ? bucketConfig.getCdnUrl(
        weight?.cover_image?.maybe_cover_image_public_bucket_path
      )
    : "/images/avatars/default-pfp.png";

  const [isLoading, setIsLoading] = useState(true);

  return (
    <div>
      <div
        className="fy-featured-voices d-flex align-items-center position-relative"
        onClick={() => onClick && weight && onClick(weight)}
        style={{ height: "74px" }}
      >
        {isLoading ? (
          <div className="w-100 d-flex align-items-center justify-content-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <WeightCoverImage {...{ src: coverImage, height: 50, width: 50 }} />
            <div className="d-flex flex-column justify-content-center overflow-hidden">
              <h6
                className="mb-1 fw-semibold"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "265px",
                }}
              >
                {weight?.title}
              </h6>
              <div className="d-inline-flex gap-2">
                <span className="fs-7 fw-medium" style={{ opacity: 0.6 }}>
                  by {weight?.creator.display_name}
                </span>
                <span className="d-inline-flex align-items-center">
                  <CardBadge
                    label={weightType}
                    color={weightTagColor}
                    small={true}
                  />
                </span>
              </div>
            </div>
            <div
              className="position-absolute fs-7 fw-medium fy-select-voice"
              style={{ bottom: "8px", right: "8px" }}
            >
              Use
            </div>
          </>
        )}
      </div>
    </div>
  );
};
