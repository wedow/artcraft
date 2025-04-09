import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookmark } from "@fortawesome/pro-solid-svg-icons";
import { faBookmark as faBookmarkOutline } from "@fortawesome/pro-regular-svg-icons";
import { WorkDots } from "components/svg";
import { AnimationStatus, useAnimationStatus } from "hooks";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "./BookmarkButton.scss";
// import useShortenNumber from "hooks/useShortenNumber";

interface BookmarkButtonProps {
  busy?: boolean;
  entityToken?: string;
  entityType?: string;
  favoriteCount?: number;
  isToggled: boolean;
  large?: boolean;
  overlay?: boolean;
  toggle: (entityToken: string, entityType: string) => any;
}

export default function BookmarkButton({
  busy,
  entityToken = "",
  entityType = "",
  favoriteCount,
  isToggled,
  large,
  overlay,
  toggle,
}: BookmarkButtonProps) {
  const { events, status } = useAnimationStatus();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // setIsLoading(true);
    if (status === AnimationStatus.paused) {
      toggle(entityToken, entityType).then((isToggled: boolean) => {
        // setIsToggled(isToggled);
        setIsLoading(false);
      });
    }
  };

  const buttonClass = isToggled ? "favorite-button toggled" : "favorite-button";
  const buttonShadow = overlay ? "shadow" : "";
  const iconClass = isToggled ? "icon-toggled" : "icon-default";
  const toolTip = isToggled ? "Unbookmark" : "Bookmark";
  // let favoriteCountShort = useShortenNumber(favoriteCount || 0);

  const index = busy ? 0 : isToggled ? 1 : 2;

  return (
    <>
      <Tippy
        theme="fakeyou"
        content={toolTip}
        hideOnClick={false}
        trigger="mouseenter"
        delay={[500, 0]}
        offset={[0, 12]}
        placement="bottom"
      >
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`${buttonClass} ${buttonShadow} ${large ? "large" : ""}`}
        >
          <FontAwesomeIcon
            icon={isToggled ? faBookmark : faBookmarkOutline}
            className={`${iconClass} me-2`}
          />
          <div className="favorite-text">
            <div {...{ className: "favorite-text-wrapper" }}>
              <WorkDots
                {...{ events, labels: ["Saved", "Save"], noPad: true, index }}
              />
            </div>
          </div>
        </button>
      </Tippy>
    </>
  );
}
