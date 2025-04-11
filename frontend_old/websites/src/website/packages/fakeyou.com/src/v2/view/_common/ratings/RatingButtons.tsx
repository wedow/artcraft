import React, { useState, useCallback, useEffect } from "react";
import {
  GetUserRating,
  GetUserRatingIsOk,
} from "@storyteller/components/src/api/user_ratings/GetUserRating";
import {
  SetUserRating,
  SetUserRatingIsOk,
} from "@storyteller/components/src/api/user_ratings/SetUserRating";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbsDown, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { useLocalize } from "hooks";

interface Props {
  entity_type: string;
  entity_token: string;
}

/**
 * This is a reusable component that can be put on several different pages.
 *
 * It requires the entity type ("tts_model", "tts_result", "w2l_template", "w2l_result", etc.)
 * and the entity token, and it will be able to fetch a user's previous vote and change it.
 *
 * This button component manages all of its own state and API calls.
 */
function RatingButtons(props: Props) {
  const [userRatingValue, setUserRatingValue] = useState<string | undefined>(
    undefined
  );

  const { t } = useLocalize("Rating");

  const loadRating = useCallback(async () => {
    const request = {
      entity_type: props.entity_type,
      entity_token: props.entity_token,
    };
    const rating = await GetUserRating(request);
    if (GetUserRatingIsOk(rating)) {
      let ratingValue = rating.maybe_rating_value || undefined;
      setUserRatingValue(ratingValue);
    }
  }, [setUserRatingValue, props.entity_type, props.entity_token]);

  const toggleUpvote = async () => {
    let nextValue = userRatingValue === "positive" ? "neutral" : "positive";
    await setRating(nextValue);
  };

  const toggleDownvote = async () => {
    let nextValue = userRatingValue === "negative" ? "neutral" : "negative";
    await setRating(nextValue);
  };

  const setRating = async (ratingValue: string) => {
    const request = {
      entity_type: props.entity_type,
      entity_token: props.entity_token,
      rating_value: ratingValue,
    };
    const result = await SetUserRating(request);
    if (SetUserRatingIsOk(result)) {
      setUserRatingValue(ratingValue);
      loadRating();
    }
  };

  useEffect(() => {
    loadRating();
  }, [loadRating, props.entity_token]);

  let upClasses = "btn-rate left";
  let downClasses = "btn-rate right";

  if (userRatingValue === "positive") {
    upClasses += " rated";
  } else if (userRatingValue === "negative") {
    downClasses += " rated";
  }

  const upvoteTooltip = t("buttonGood");
  const downvoteTooltip = t("buttonBad");

  return (
    <div className="d-flex">
      <Tippy
        content={upvoteTooltip}
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <button className={upClasses} onClick={toggleUpvote} type="button">
          <FontAwesomeIcon icon={faThumbsUp} />
        </button>
      </Tippy>

      <div className="vr"></div>

      <Tippy
        content={downvoteTooltip}
        hideOnClick
        placement="bottom"
        theme="fakeyou"
        arrow={false}
      >
        <button className={downClasses} onClick={toggleDownvote} type="button">
          <FontAwesomeIcon icon={faThumbsDown} />
        </button>
      </Tippy>
    </div>
  );
}

export { RatingButtons };
