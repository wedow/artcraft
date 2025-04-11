import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/pro-solid-svg-icons";
import "./WeightCoverImage.scss";

interface WeightCoverImageProps {
  src?: string;
  alt?: string;
  height?: number;
  onClick?: (e: any) => any;
  to?: string;
  width?: number;
  coverIndex?: number;
  marginRight?: number;
}

export default function WeightCoverImage({
  src,
  alt,
  height = 100,
  onClick,
  to,
  width = 100,
  coverIndex,
  marginRight,
}: WeightCoverImageProps) {
  const containerStyle = {
    height: `${height}px`,
    width: `${width}px`,
    minWidth: `${width}px`,
    backgroundColor: src ? "#F3F4F6" : "",
    marginRight: `${marginRight}px`,
  };

  let image = `/images/default-covers/${coverIndex || 0}.webp`;
  if (src) {
    image = src;
  }

  return (
    <div
      {...{
        className: `cover-img ${onClick ? "cover-img-hoverable" : ""}`,
        style: containerStyle,
        onClick,
      }}
    >
      <img src={image} alt={alt || "Model Weight Cover"} />
      {to ? (
        <Link {...{ className: "cover-img-edit", to }}>
          <span>Edit cover image</span>
          <FontAwesomeIcon icon={faPen} />
        </Link>
      ) : null}
    </div>
  );
}
