import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFrown,
  faStar,
  faStarHalfAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faStarExclamation } from "@fortawesome/pro-solid-svg-icons";
import { prettyNum, ROUNDING_MODE } from "pretty-num";
import { useLocalize } from "hooks";

interface Props {
  positive_votes: number;
  negative_votes: number;
  // Total votes should equal (positive_votes + negative_votes).
  // It does not include "neutral" votes, where the user revokes their vote.
  total_votes: number;
}

function RatingStats(props: Props) {
  const { t } = useLocalize("Rating");

  if (
    props.total_votes === 0 ||
    (props.positive_votes === 0 && props.negative_votes === 0)
  ) {
    return (
      <div className="d-flex align-items-center">
        <FontAwesomeIcon
          icon={faStarExclamation}
          className="me-2 rating-icon"
        />
        <p>{t("ratingNone")}</p>
      </div>
    );
  }

  // Rating scale: 0 to 5, with one decimal digit.
  let score = (props.positive_votes / props.total_votes) * 5.0;
  let scoreRounded = prettyNum(score, {
    precision: 1,
    roundingMode: ROUNDING_MODE.CEIL,
  });

  let scoreTitle;
  let icon;

  if (scoreRounded >= 4.0) {
    scoreTitle = t("ratingGreat");
    icon = faStar;
  } else if (scoreRounded >= 3.0) {
    scoreTitle = t("ratingGood");
    icon = faStar;
  } else if (scoreRounded >= 2.0) {
    scoreTitle = t("ratingOk");
    icon = faStarHalfAlt;
  } else {
    scoreTitle = t("ratingBad");
    icon = faFrown;
  }

  return (
    <div className="d-flex align-items-center">
      <FontAwesomeIcon icon={icon} className="me-2 rating-icon" />
      <p>
        {t("ratingLabel")}{" "}
        <span className="fw-medium">
          {scoreRounded} — {scoreTitle}
        </span>
      </p>
    </div>
  );
}

export { RatingStats };
