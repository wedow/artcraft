import React from "react";
import "./Card.scss";

interface CardProps {
  padding?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  canHover?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  backgroundImage?: string;
  height?: string;
  borderWidth?: string;
  hoverPrimaryColor?: true;
  aspectRatio?: string;
  bottomText?: string;
}

export default function Card({
  padding,
  children,
  onClick,
  canHover,
  onMouseEnter,
  onMouseLeave,
  backgroundImage,
  height,
  borderWidth,
  hoverPrimaryColor,
  aspectRatio = "auto",
}: CardProps) {
  return (
    <>
      <div
        className={`card ${padding ? "p-3" : ""} ${
          onClick || canHover ? "card-clickable" : ""
        } ${hoverPrimaryColor ? "card-hover-border-red" : ""}
        }`.trim()}
        style={{
          // ...(backgroundImage
          //   ? {
          //       backgroundImage: `url(${backgroundImage})`,
          //       backgroundSize: "cover",
          //       backgroundPosition: "center",
          //     }
          //   : {}),
          minHeight: "153px",
          height: height || "auto",
          borderWidth: borderWidth || "2px",
          borderStyle: "solid",
          aspectRatio: aspectRatio || "auto",
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
        {backgroundImage && (
          <img src={backgroundImage} alt="Thumbnail" className="card-bg" />
        )}
      </div>
    </>
  );
}
