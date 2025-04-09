import { Panel } from "components/common";
import React, { useEffect, useRef } from "react";
import "./SdCoverImagePanel.scss";

interface SdCoverImagePanelProps {
  src: string;
  alt?: string;
}

export default function SdCoverImagePanel({
  src,
  alt,
}: SdCoverImagePanelProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      img.onload = () => {
        // Determine whether the image is horizontal or vertical
        if (img.naturalWidth > img.naturalHeight) {
          img.classList.remove("vertical");
        } else {
          img.classList.add("vertical");
        }
      };
    }
  }, [src]);

  return (
    <Panel>
      <div className="sd-cover-img-container px-3 py-3">
        <img ref={imgRef} src={src} alt={alt} className="vertical" />
      </div>
    </Panel>
  );
}
