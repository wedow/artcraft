import { Button } from "@storyteller/ui-button";
import {
  faApple,
  faWindows,
  faLinux,
} from "@fortawesome/free-brands-svg-icons";
import { isMobile, isWindows, isMacOs } from "react-device-detect";
import { DOWNLOAD_LINKS } from "../../config/downloads";

interface DownloadButtonProps {
  className?: string;
}

export const DownloadButton = ({ className = "" }: DownloadButtonProps) => {
  // Helper function to detect Linux
  const isLinux =
    !isWindows &&
    !isMacOs &&
    navigator.platform.toLowerCase().includes("linux");

  const handleDownload = () => {
    const downloadLink = isWindows
      ? DOWNLOAD_LINKS.WINDOWS
      : isMacOs
      ? DOWNLOAD_LINKS.MACOS
      : isLinux
      ? DOWNLOAD_LINKS.LINUX
      : null;
    if (downloadLink) {
      window.open(downloadLink, "_blank");
    }
  };

  const getIcon = () => {
    if (isMobile) return undefined;
    if (isWindows) return faWindows;
    if (isMacOs) return faApple;
    if (isLinux) return faLinux;
    return undefined;
  };

  return (
    <Button
      className={`rounded-xl px-8 py-4 text-md transition-all duration-300 shadow-lg hover:shadow-blue-500/25 ${className}`}
      disabled={isMobile || (!isWindows && !isMacOs && !isLinux)}
      icon={getIcon()}
      onClick={handleDownload}
    >
      {isMobile
        ? "Download on desktop"
        : isWindows
        ? "Download for Windows"
        : isMacOs
        ? "Download for MacOS"
        : isLinux
        ? "Download for Linux"
        : "Not available on your device"}
    </Button>
  );
};
