import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faLongArrowRight } from "@fortawesome/pro-solid-svg-icons";

interface BadgeContent {
  type: string;
  icon: IconDefinition;
  label: string;
}

interface AIToolsItemProps {
  to?: string;
  title: string;
  text?: string;
  imgSrc?: string;
  imgAlt: string;
  badgeContent?: BadgeContent;
  videoSrc?: string;
  videoPosterSrc?: string;
  externalLink?: string;
  videoPosition?: "top" | "center";
}

export function AIToolsItem({
  to,
  title,
  text,
  imgSrc,
  imgAlt,
  badgeContent,
  videoSrc,
  videoPosterSrc,
  externalLink,
  videoPosition = "center",
}: AIToolsItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoSrc) {
      if (videoRef.current && !isPlaying) {
        setShowPoster(false);
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTouchStart = () => {
    if (videoSrc) {
      if (videoRef.current && !isPlaying) {
        setShowPoster(false);
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setShowPoster(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      }, 200);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const timeRemaining =
        videoRef.current.duration - videoRef.current.currentTime;
      if (timeRemaining <= 0.2) {
        setShowPoster(true);
      }
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, []);

  const item = (
    <>
      <div className="d-flex px-3 pt-3 px-xl-4 pt-xl-4 align-items-start w-100">
        <div className="flex-grow-1">
          {badgeContent && (
            <div className="mb-1">
              <span
                className={`badge-${badgeContent.type} d-inline-flex align-items-center mb-2 me-2`}
              >
                <FontAwesomeIcon icon={badgeContent.icon} className="me-1" />
                {badgeContent.label}
              </span>
              <h4 className="fw-bold text-white d-inline-flex align-items-center mb-0">
                <span>{title}</span>
              </h4>
              {text && (
                <h6 className="fw-normal opacity-75 text-white">{text}</h6>
              )}
            </div>
          )}
          {!badgeContent && (
            <>
              <h3 className="fw-bold text-white mb-1">{title}</h3>
              {text && (
                <h6 className="fw-normal opacity-75 text-white">{text}</h6>
              )}
            </>
          )}
        </div>
        <Link to={to || "/"} className="btn btn-square mt-1">
          <FontAwesomeIcon icon={faLongArrowRight} className="btn-icon fs-5" />
        </Link>
      </div>
      {imgSrc && <img className="img-fluid" src={imgSrc} alt={imgAlt} />}
      {videoSrc && (
        <div className="w-100 mt-3 px-3 px-xl-4 overflow-hidden">
          <div
            className="w-100 h-100 position-relative overflow-hidden"
            style={{
              borderTopLeftRadius: "0.5rem",
              borderTopRightRadius: "0.5rem",
            }}
          >
            {videoPosterSrc && (
              <div
                className={`h-100 w-100 object-fit-cover ${
                  showPoster ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: 0,
                  transition: "opacity 0.2s ease-in-out",
                }}
              >
                <img
                  {...{
                    fetchPriority: "high",
                    src: `${videoPosterSrc}_1x.webp`,
                    srcSet: `${videoPosterSrc}_1x.webp, ${videoPosterSrc}_2x.webp 2x, ${videoPosterSrc}_3x.webp 3x`,
                  }}
                  className="h-100 w-100 object-fit-cover"
                  alt={imgAlt}
                />
              </div>
            )}

            <video
              ref={videoRef}
              muted={true}
              playsInline={true}
              className="w-100 h-100 object-fit-cover"
              style={{
                borderTopLeftRadius: "0.5rem",
                borderTopRightRadius: "0.5rem",
                objectPosition: videoPosition,
              }}
              onEnded={handleVideoEnded}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="col-12 col-md-6 col-lg-4">
      {!externalLink ? (
        <Link
          to={to || "/"}
          className="panel panel-select d-flex flex-column align-items-center"
          onMouseEnter={handleMouseEnter}
          onTouchStart={handleTouchStart}
        >
          {item}
        </Link>
      ) : (
        <div
          onClick={() => window.open(externalLink, "_blank")}
          className="panel panel-select d-flex flex-column align-items-center"
          style={{ cursor: "pointer" }}
          onMouseEnter={handleMouseEnter}
          onTouchStart={handleTouchStart}
        >
          {item}
        </div>
      )}
    </div>
  );
}

interface AIToolsRowProps {
  items: AIToolsItemProps[];
  bgDotsLeft?: boolean;
  bgDotsRight?: boolean;
}

export default function AIToolsRow({
  items,
  bgDotsLeft,
  bgDotsRight,
}: AIToolsRowProps) {
  return (
    <div className="row g-4 position-relative">
      {items.map((item, index) => (
        <AIToolsItem key={index} {...item} />
      ))}
      {bgDotsLeft && (
        <img
          src="/images/landing/bg-dots.webp"
          alt="background dots"
          className="dots-right-top"
        />
      )}
      {bgDotsRight && (
        <img
          src="/images/landing/bg-dots.webp"
          alt="background dots"
          className="dots-left-bottom"
        />
      )}
    </div>
  );
}
