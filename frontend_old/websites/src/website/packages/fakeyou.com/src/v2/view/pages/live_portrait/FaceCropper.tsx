import React, { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";

interface FaceCropperProps {
  videoSrc: string;
  zoomWithScroll?: boolean;
  showGrid?: boolean;
  isCropping?: boolean;
  mediaProps?: any;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  setCropArea?: (cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  resetTrigger?: any;
}

const FaceCropper: React.FC<FaceCropperProps> = ({
  videoSrc,
  zoomWithScroll = false,
  showGrid = false,
  isCropping,
  onCropComplete,
  setCropArea,
  resetTrigger,
  ...props
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const onCropChange = useCallback(
    newCrop => {
      if (isCropping) {
        setCrop(newCrop);
      }
    },
    [isCropping]
  );

  const onZoomChange = useCallback(newZoom => {
    setZoom(newZoom);
  }, []);

  const handleCropComplete = useCallback(
    (croppedArea, croppedAreaPixels) => {
      onCropComplete(croppedArea, croppedAreaPixels);
    },
    [onCropComplete]
  );

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (setCropArea) {
      setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    }
  }, [resetTrigger, setCropArea]);

  return (
    <Cropper
      video={videoSrc}
      crop={crop}
      zoom={zoom}
      zoomWithScroll={zoomWithScroll}
      aspect={1}
      onCropChange={onCropChange}
      onZoomChange={onZoomChange}
      showGrid={showGrid}
      objectFit="cover"
      classes={{
        cropAreaClassName: `border-0 ${
          isCropping ? "" : "cursor-default"
        }`.trim(),
      }}
      zoomSpeed={0.25}
      onCropComplete={handleCropComplete}
      {...props}
    />
  );
};

export default FaceCropper;
