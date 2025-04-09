import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChevronRight,
  faThumbsUp,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import WeightCoverImage from "components/common/WeightCoverImage";
import CardBadge from "components/entities/CardBadge";
import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import { isMobile } from "react-device-detect";
import { WeightType } from "@storyteller/components/src/api/_common/enums";
import useWeightTypeInfo from "hooks/useWeightTypeInfo";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { useLocalize, useRatings, useSession, useWeightFetch } from "hooks";
import Stat from "components/common/Stat/Stat";
import { ActionButton, ActionButtonProps } from "components/common";
import { faThumbsUp as faThumbsUpOutline } from "@fortawesome/pro-regular-svg-icons";
import { FetchStatus } from "@storyteller/components/src/api";
import LoadingSpinner from "components/common/LoadingSpinner";
import {
  LanguageLabels,
  LanguageTag,
} from "@storyteller/components/src/api/Languages";

interface VoicePickerPreviewProps {
  selectedVoice: any;
  openModal: () => void;
}

const VoicePickerPreview: React.FC<VoicePickerPreviewProps> = ({
  selectedVoice,
  openModal,
}) => {
  const bucketConfig = new BucketConfig();
  const preview = selectedVoice?.cover_image
    ?.maybe_cover_image_public_bucket_path
    ? bucketConfig.getCdnUrl(
        selectedVoice?.cover_image?.maybe_cover_image_public_bucket_path
      )
    : "/images/avatars/default-pfp.png";

  const weightTypeInfo = useWeightTypeInfo(
    selectedVoice?.weight_type || WeightType.NONE
  );
  const { label: weightType, color: weightTagColor } = weightTypeInfo;
  const { loggedIn } = useSession();

  const ratings = useRatings();

  const fetchedWeight = useWeightFetch({
    onSuccess: (res: any) => {
      ratings.gather({ res, key: "weight_token" });
    },
    token: selectedVoice?.weight_token,
    refetch: true,
  });

  const { data: weight, status } = fetchedWeight;

  const ratingButtonProps: ActionButtonProps = {
    ...ratings.makeProps({
      entityToken: weight?.weight_token || "",
      entityType: "model_weight",
    }),
    toolTipOff: "Like this voice",
    toolTipOn: "Unlike this voice",
    iconOn: faThumbsUp,
    iconOff: faThumbsUpOutline,
    color: "action",
    toolTipPlacement: "top",
    toolTipDisable: isMobile,
    style: { minHeight: "1.75rem", fontSize: "14px" },
  };

  const languageLabel =
    LanguageLabels[
      selectedVoice?.maybe_ietf_primary_language_subtag as LanguageTag
    ] || "-";

  const { t } = useLocalize("NewTTS");

  return (
    <>
      <div
        className={`fy-weight-picker-preview ${
          selectedVoice ? "fy-weight-picker-preview-selected" : ""
        }`.trim()}
        onClick={openModal}
      >
        <WeightCoverImage
          {...{
            src: preview,
            height: isMobile ? 85 : 95,
            width: isMobile ? 85 : 95,
          }}
        />
        <div className="d-flex flex-column justify-content-center flex-grow-1">
          <div className="d-flex gap-2 align-items-center fy-weight-picker-preview-text flex-wrap mb-1">
            <h2 className="mb-1">
              {selectedVoice?.title || t("button.labelNoVoice")}
            </h2>
          </div>
          {selectedVoice?.weight_type && (
            <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center mb-lg-1">
              <div className="d-flex align-items-center gap-1">
                <CardBadge
                  className={`h-auto fy-entity-type-${
                    selectedVoice?.weight_type || ""
                  }`}
                  label={weightType || ""}
                  small={true}
                  color={weightTagColor || ""}
                />
                {selectedVoice?.maybe_ietf_primary_language_subtag && (
                  <CardBadge label={languageLabel} small={true} color="gray" />
                )}
              </div>

              <div className="d-flex gap-2 align-items-center">
                <div className="opacity-75">
                  <Stat
                    count={selectedVoice?.usage_count}
                    icon={faWaveformLines}
                  />
                </div>

                {loggedIn ? (
                  <>
                    {status === FetchStatus.success ? (
                      <div onClick={e => e.stopPropagation()}>
                        <ActionButton {...ratingButtonProps} />
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center"
                        style={{ minHeight: "1.75rem" }}
                      >
                        <LoadingSpinner thin={true} size={20} padding={false} />
                      </div>
                    )}
                  </>
                ) : (
                  <span className="d-flex align-items-center gap-1 fs-7 opacity-75">
                    <FontAwesomeIcon icon={faThumbsUp} />
                    {selectedVoice?.stats?.positive_rating_count}
                  </span>
                )}
              </div>
            </div>
          )}
          {selectedVoice ? null : (
            <span className="fs-7 opacity-75">
              {t("button.labelClickToSelect")}
            </span>
          )}
        </div>

        <div className="d-flex gap-2 align-items-center">
          <span className="fw-medium opacity-75 pe-1 d-none d-lg-block">
            {selectedVoice
              ? t("button.labelChangeVoice")
              : t("button.labelSelectVoice")}
          </span>
          <FontAwesomeIcon icon={faChevronRight} className="fs-5 me-1" />
        </div>
      </div>

      {selectedVoice && (
        <div
          className="fs-7 d-flex gap-1 flex-wrap panel-inner mb-1"
          style={{
            padding: "0.75rem",
            borderRadius: "0rem 0rem 0.5rem 0.5rem",
          }}
        >
          <div className="d-flex gap-1 align-items-center">
            <div className="opacity-75">
              <span className="d-none d-lg-inline-block">Created</span> by
            </div>

            <Link
              className="fw-medium d-flex align-items-center"
              to={`/profile/${selectedVoice?.creator?.username || ""}`}
              onClick={e => e.stopPropagation()}
              style={{ gap: "6px" }}
            >
              {selectedVoice?.creator?.display_name || ""}
              <Gravatar
                size={18}
                noHeight={true}
                email_hash={selectedVoice?.creator?.gravatar_hash}
                avatarIndex={
                  selectedVoice?.creator?.default_avatar?.image_index || 0
                }
                backgroundIndex={
                  selectedVoice?.creator?.default_avatar?.color_index || 0
                }
              />
            </Link>
          </div>
          <div className="d-flex gap-1 align-items-center">
            <span className="px-1 opacity-50">|</span>
            <Link
              to={`/weight/${selectedVoice.weight_token}`}
              className="fw-medium"
              onClick={e => e.stopPropagation()}
            >
              {t("link.viewDetails")}
              <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default VoicePickerPreview;
