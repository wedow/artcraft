import React, { useState, useEffect } from "react";

interface OutputThumbnailImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  draggable?: boolean;
}

const OutputThumbnailImage: React.FC<OutputThumbnailImageProps> = ({
  src,
  alt,
  style,
  draggable,
}) => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const maxAttempts = 5;
    let attempts = 0;

    const checkImage = () => {
      const img = new Image();
      const thumbSrc = src + "-thumb.jpg";
      img.src = thumbSrc;
      img.onload = () => {
        if (isMounted) {
          setThumbnailSrc(thumbSrc);
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        if (isMounted && attempts < maxAttempts) {
          setTimeout(checkImage, 1000);
          attempts += 1;
        } else {
          setIsLoading(false);
        }
      };
    };

    if (src && src.toLowerCase().endsWith(".mp4")) {
      checkImage();
    } else {
      setThumbnailSrc(src);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (isLoading || !thumbnailSrc) {
    return null;
  }

  return (
    <img
      key={thumbnailSrc}
      src={thumbnailSrc}
      alt={alt}
      style={style}
      draggable={draggable}
    />
  );
};

export default OutputThumbnailImage;
