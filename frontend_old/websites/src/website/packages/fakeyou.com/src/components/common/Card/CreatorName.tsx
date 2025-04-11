import { Gravatar } from "@storyteller/components/src/elements/Gravatar";
import React from "react";
import { Link } from "react-router-dom";

interface CreatorNameProps {
  displayName: string;
  username: string;
  gravatarHash: string;
  avatarIndex: number;
  backgroundIndex: number;
  className?: string;
  noHeight?: boolean;
  creatorLink?: boolean;
  showGravatar?: boolean;
}

export default function CreatorName({
  displayName,
  gravatarHash,
  avatarIndex,
  backgroundIndex,
  username,
  className,
  noHeight,
  creatorLink = true,
  showGravatar = true,
}: CreatorNameProps) {
  const handleInnerClick = (event: any) => {
    // event.stopPropagation();
  };

  const gravatar = (
    <>
      {showGravatar ? (
        <Gravatar
          {...{ noHeight }}
          size={18}
          email_hash={gravatarHash}
          avatarIndex={avatarIndex || 0}
          backgroundIndex={backgroundIndex || 0}
        />
      ) : (
        <span className="fs-7 fw-medium" style={{ opacity: 0.6 }}>
          by
        </span>
      )}
    </>
  );

  const creatorName = (
    <div
      className="fw-medium fs-7 text-white text-truncate"
      style={{ opacity: "0.6" }}
    >
      {displayName}
    </div>
  );

  return (
    <>
      {displayName === "Anonymous" ? (
        <div className="d-flex gap-2 align-items-center">
          {showGravatar && gravatar}
          <div
            {...{
              className: "fw-medium fs-7 text-white opacity-75 text-truncate",
            }}
          >
            {displayName}
          </div>
        </div>
      ) : (
        <>
          {creatorLink ? (
            <Link
              className={`d-flex align-items-center ${className}`}
              style={{ gap: showGravatar ? "6px" : "3px" }}
              onClick={handleInnerClick}
              to={`/profile/${username}`}
            >
              {gravatar}
              {creatorName}
            </Link>
          ) : (
            <div
              className={`d-flex align-items-center ${className}`}
              style={{ gap: showGravatar ? "6px" : "3px" }}
            >
              {gravatar}
              {creatorName}
            </div>
          )}
        </>
      )}
    </>
  );
}
