import { faDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { useSignalEffect } from "@preact/signals-react";
import { useState } from "react";

import {
  downloadingItems,
  dispatchers,
} from "~/signals/uiEvents/modelSelection";
import { downloadModel } from "~/services/modelDownloadService";

interface ModelCardProps {
  id: string;
  name: string;
  imageUrl: string;
  isDownloaded: boolean;
  isSelected: boolean;
  isCompatible: boolean;
  type: "model" | "lora";
  onSelect: (id: string) => void;
}

export const ModelCard = ({
  id,
  name,
  imageUrl,
  isDownloaded,
  isSelected,
  isCompatible,
  type,
  onSelect,
}: ModelCardProps) => {
  // Local state to track download status and progress
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localIsDownloaded, setLocalIsDownloaded] = useState(isDownloaded);

  // Update local state when downloadingItems changes
  useSignalEffect(() => {
    const downloads = downloadingItems.value;
    const isCurrentlyDownloading = !!downloads[id];
    setIsDownloading(isCurrentlyDownloading);

    if (isCurrentlyDownloading) {
      setProgress(downloads[id].progress);
    }
  });

  // Function to handle the download
  const handleDownload = async () => {
    try {
      // Use the download service to start the download
      await downloadModel(id, type);

      // For the dummy implementation, we'll update the local state when download completes
      const checkDownloadStatus = setInterval(() => {
        if (!dispatchers.isDownloading(id)) {
          clearInterval(checkDownloadStatus);
          setLocalIsDownloaded(true);
        }
      }, 500);
    } catch (error) {
      console.error(`Error downloading ${type} ${id}:`, error);
    }
  };

  const handleClick = () => {
    if (!isCompatible) return; // Do nothing if not compatible

    if (isDownloading) return; // Do nothing if already downloading

    if (localIsDownloaded) {
      onSelect(id);
    } else {
      handleDownload();
    }
  };

  return (
    <div
      className={twMerge(
        "relative flex aspect-square flex-col items-center overflow-hidden rounded-xl border-2 bg-white/5 transition-all",
        isSelected ? "border-primary" : "border-transparent",
        !isCompatible ? "opacity-50 grayscale" : "hover:border-primary",
        "cursor-pointer",
      )}
      onClick={handleClick}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      )}

      {/* Image container */}
      <div className="relative h-full w-full overflow-hidden">
        {/* Downloading indicator */}
        {isDownloading && (
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-gray-900/75">
            <svg
              className="h-8 w-8 animate-spin text-white/40"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
            >
              <path
                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/90"
              ></path>
            </svg>
            <div className="mt-2 text-center font-medium text-white">
              {progress}%
            </div>
          </div>
        )}

        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />

        {/* Title */}
        <div className="absolute bottom-0 mt-2 flex w-full items-center justify-between bg-[#3E3E41]/70 px-2 py-1 text-sm font-medium backdrop-blur-[2px]">
          {name}
          {!localIsDownloaded && !isDownloading && (
            <FontAwesomeIcon icon={faDownToLine} className="text-white" />
          )}
        </div>
      </div>
    </div>
  );
};
