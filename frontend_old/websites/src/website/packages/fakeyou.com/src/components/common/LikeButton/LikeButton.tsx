import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsUp } from "@fortawesome/pro-solid-svg-icons";
import { faThumbsUp as faThumbsUpOutline } from "@fortawesome/pro-regular-svg-icons";
import { WorkDots } from "components/svg";
import { AnimationStatus, useAnimationStatus } from "hooks";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import "./LikeButton.scss";
import useShortenNumber from "hooks/useShortenNumber";

interface LikeButtonProps {
  busy?: boolean;
  entityToken?: string;
  entityType?: string;
  likeCount: number;
  isToggled: boolean;
  overlay?: boolean;
  large?: boolean;
  toggle: (entityToken: string, entityType: string) => any;
}

export default function LikeButton({
  busy,
  entityToken = "",
  entityType = "",
  likeCount = 0, // useShortenNumber freaks out if likeCount = NaN, give it a default value until it loads
  isToggled,
  overlay,
  large,
  toggle,
}: LikeButtonProps) {
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
    // try {
    //   await onToggle(!isToggled);
    //   setIsToggled(!isToggled);
    // } catch (error) {
    //   console.error("Error calling API", error);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const buttonClass = isToggled ? "like-button toggled" : "like-button";
  const buttonShadow = overlay ? "shadow" : "";
  const iconClass = isToggled ? "icon-toggled" : "icon-default";
  const toolTip = isToggled ? "Unlike" : "Like";
  let likeCountShort = useShortenNumber(likeCount);

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
            icon={isToggled ? faThumbsUp : faThumbsUpOutline}
            className={`${iconClass} me-2 fw-bold`}
          />
          <div className="like-number">
            <div className="like-number-wrapper">
              <WorkDots
                {...{
                  events,
                  labels: [likeCountShort],
                  noPad: true,
                  index: busy ? 0 : 1,
                }}
              />
            </div>
          </div>
        </button>
      </Tippy>
    </>
  );
}
