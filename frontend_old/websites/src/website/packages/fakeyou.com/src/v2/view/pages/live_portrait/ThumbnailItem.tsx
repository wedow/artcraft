import LoadingSpinner from "components/common/LoadingSpinner";
import React, { useEffect, useState } from "react";

interface ThumbnailItemProps {
  index: number;
  selectedIndex: number;
  handleThumbnailClick?: (index: number) => void;
  poster?: string;
  mediaType?: string;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({
  index,
  selectedIndex,
  handleThumbnailClick,
  poster,
  mediaType,
}) => {
  const [isThumbReady, setIsThumbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkImage = () => {
      const img = new Image();
      img.src = poster + "-thumb.jpg";
      img.onload = () => {
        if (isMounted) {
          setIsThumbReady(true);
        }
      };
      img.onerror = () => {
        if (isMounted && !isThumbReady) {
          setTimeout(checkImage, 1000); // Retry after 1 second if the image is not available
        }
      };
    };

    if (poster && mediaType === "video") {
      checkImage();
    }

    return () => {
      isMounted = false;
    };
  }, [poster, mediaType, isThumbReady]);

  return (
    <div className="col-3" key={index}>
      <div
        className={`lp-thumbnail ${index === selectedIndex ? "active" : ""}`}
        onClick={() => handleThumbnailClick && handleThumbnailClick(index)}
      >
        {poster ? (
          mediaType === "image" ? (
            <img
              src={poster}
              alt="Media Thumbnail"
              className="w-100 h-100 object-fit-cover"
              draggable="false"
            />
          ) : (
            <>
              {isThumbReady ? (
                <img
                  src={poster + "-thumb.jpg"}
                  alt="Media Thumbnail"
                  className="w-100 h-100 object-fit-cover"
                  draggable="false"
                />
              ) : (
                <LoadingSpinner padding={false} />
              )}
            </>
          )
        ) : (
          <LoadingSpinner padding={false} />
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className={`lp-thumbnail-selected-icon ${
            index === selectedIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <path
            opacity="1"
            d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
            fill="#FC6B68"
          />
          <path
            d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </div>
  );
};

export default ThumbnailItem;
