import React from "react";
import { MakeBatchProps } from "hooks/useBatchContent";
import { MakeRatingsProps } from "hooks/useRatings";
import { UserDetailsLight } from "@storyteller/components/src/api/_common/UserDetailsLight";
import BookmarkButton from "components/common/BookmarkButton";
import LikeButton from "components/common/LikeButton";
import CreatorName from "components/common/Card/CreatorName";
import "./CardFooter.scss";

interface CardFooterProps {
  creator?: UserDetailsLight;
  entityToken: string;
  entityType: string;
  makeBookmarksProps?: MakeBatchProps;
  makeRatingsProps?: MakeRatingsProps; // this is MakeBatchProps extended to include likeCount
  showCreator?: boolean;
  showDivider?: boolean;
  showUseButton?: boolean;
  creatorLink?: boolean;
  showGravatar?: boolean;
  inSelectModal?: boolean;
}

export default function CardFooter({
  creator,
  entityToken,
  entityType,
  makeBookmarksProps,
  makeRatingsProps,
  showCreator,
  showDivider = true,
  showUseButton = false,
  creatorLink,
  showGravatar,
  inSelectModal,
}: CardFooterProps) {
  const {
    default_avatar,
    display_name,
    gravatar_hash,
    username = "",
  } = creator || {};
  const togglesOn = makeBookmarksProps || makeRatingsProps;
  const eitherOn = showCreator || togglesOn;
  return (
    <>
      {eitherOn && showDivider && <hr className="my-2" />}
      <div {...{ className: `fy-card-footer` }}>
        {showCreator && (
          <CreatorName
            {...{
              avatarIndex: default_avatar?.image_index || 0,
              backgroundIndex: default_avatar?.color_index || 0,
              displayName: display_name || "Anonymous",
              gravatarHash: gravatar_hash || "",
              noHeight: true,
              username,
              creatorLink,
              showGravatar,
            }}
          />
        )}
        {togglesOn ? (
          <div {...{ className: "fy-card-footer-toggles" }}>
            {makeRatingsProps && (
              <LikeButton {...makeRatingsProps({ entityToken, entityType })} />
            )}
            {makeBookmarksProps && (
              <BookmarkButton
                {...makeBookmarksProps({ entityToken, entityType })}
              />
            )}
            {!inSelectModal && showUseButton && (
              <div
                className="fs-7 fw-medium fy-select-voice d-flex align-items-center justify-content-center rounded"
                style={{ top: "14px", right: "14px" }}
              >
                Use
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
