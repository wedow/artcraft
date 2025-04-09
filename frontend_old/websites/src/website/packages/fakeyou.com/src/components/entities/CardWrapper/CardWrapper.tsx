import React from "react";
import { Link } from "react-router-dom";
import getCardUrl from "components/common/Card/getCardUrl";
import "./CardWrapper.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/pro-solid-svg-icons";
import { useHover } from "hooks";
import { MediaFile } from "@storyteller/components/src/api/media_files";

interface Props {
  canHover?: boolean;
  card: React.ElementType;

  data: MediaFile;
  onClick?: (e: any) => any;
  padding?: boolean;
  preview: React.ElementType;
  source?: string;
  type: "media" | "weights";
  featured?: boolean;
}

export default function CardWrapper({
  canHover,
  card: Card,
  data,
  onClick,
  padding,
  source = "",
  type,
  featured,
  ...rest
}: Props) {
  const [hover, hoverProps] = useHover({});
  const linkUrl = getCardUrl(data, source, type);
  const cardProps = { data, hover, source, type, ...rest };
  const className = `card ${padding ? "p-3" : ""} ${
    featured ? "card-featured" : ""
  } ${onClick || canHover ? "card-clickable" : ""}`.trim();

  return onClick ? (
    <div
      {...{
        className,
        onClick: () => onClick(data),
        ...hoverProps,
        style: { minHeight: "153px" },
      }}
    >
      <Card {...cardProps} />
      {featured && (
        <div className="card-featured-badge">
          <FontAwesomeIcon icon={faStar} className="me-1" />
          High Quality
        </div>
      )}
    </div>
  ) : (
    <Link
      {...{
        className,
        to: linkUrl,
        ...hoverProps,
        style: { minHeight: "153px" },
      }}
    >
      <Card {...cardProps} />
    </Link>
  );
}
