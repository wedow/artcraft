import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef, useState, useEffect } from "react";
import LoadingSpinner from "../LoadingSpinner";

interface HoverVideoCardProps {
  beforeVideoSrc: string;
  afterVideoSrc: string;
  title?: string;
  url?: string;
  allowRemix?: boolean;
}

const HoverVideoCard: React.FC<HoverVideoCardProps> = ({
  beforeVideoSrc,
  afterVideoSrc,
  title,
  url,
  allowRemix = true,
}) => {
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const beforeVideo = beforeVideoRef.current;
    const afterVideo = afterVideoRef.current;

    if (beforeVideo && afterVideo) {
      const onCanPlayThrough = () => {
        if (beforeVideo.readyState >= 4 && afterVideo.readyState >= 4) {
          setIsReady(true);
          beforeVideo.play();
          afterVideo.play();
        }
      };

      beforeVideo.addEventListener("canplaythrough", onCanPlayThrough);
      afterVideo.addEventListener("canplaythrough", onCanPlayThrough);

      return () => {
        beforeVideo.removeEventListener("canplaythrough", onCanPlayThrough);
        afterVideo.removeEventListener("canplaythrough", onCanPlayThrough);
      };
    }
  }, []);

  const handleMouseEnter = () => {
    if (beforeVideoRef.current && afterVideoRef.current) {
      afterVideoRef.current.currentTime = beforeVideoRef.current.currentTime;
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const card = (
    <>
      <div
        className="rounded overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          aspectRatio: "16 / 9",
          cursor: allowRemix ? "pointer" : "default",
          borderWidth: "2px",
          borderColor: "transparent",
          borderStyle: "solid",
          ...(isHovered ? { borderColor: "#e66462" } : {}),
          transition: "border-color 0.2s",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "25%",
            zIndex: 5,
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)",
          }}
        />
        {title && (
          <div
            className="position-absolute bottom-0 mb-2 ms-2 fw-medium"
            style={{
              zIndex: 10,
              textShadow: "0px 0px 10px rgba(0, 0, 0, 0.4)",
            }}
          >
            {title}
          </div>
        )}
        {title && allowRemix && (
          <div
            className="position-absolute bottom-0 mb-2 me-2 fw-medium"
            style={{
              zIndex: 10,
              right: 0,
            }}
          >
            <div
              className="d-flex align-items-center fw-medium fs-7"
              style={{
                opacity: isHovered ? 0.95 : 0,
                transition: "all 0.2s",
                transform: isHovered ? "translateX(0)" : "translateX(-20%)",
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                padding: "0.15rem 0.5rem",
                borderRadius: "0.5rem",
                textShadow: "0px 0px 10px rgba(0, 0, 0, 0.4)",
              }}
            >
              Remix
              <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
            </div>
          </div>
        )}
        <video
          ref={beforeVideoRef}
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: isHovered ? 0 : 1,
            objectFit: "cover",
          }}
        >
          <source src={beforeVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <video
          ref={afterVideoRef}
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: isHovered ? 1 : 0,
            objectFit: "cover",
          }}
        >
          <source src={afterVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {!isReady && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="h-100 w-100 d-flex justify-content-center align-items-center">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {allowRemix ? (
        <a href={url} className="text-white">
          {card}
        </a>
      ) : (
        <div className="text-white">{card}</div>
      )}
    </>
  );
};

export default HoverVideoCard;
