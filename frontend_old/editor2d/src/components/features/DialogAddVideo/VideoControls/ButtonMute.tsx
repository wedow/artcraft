import { useEffect, useState } from "react";

import { faVolumeSlash, faVolume } from "@fortawesome/pro-solid-svg-icons";

import { Button } from "~/components/ui";
import { Tooltip } from "~/components/ui";
export function ButtonMute({ vidEl }: { vidEl: HTMLVideoElement }) {
  const [isMuted, setIsMuted] = useState<boolean>(vidEl.muted || false);

  const toggleMute = () => {
    if (vidEl.muted) {
      vidEl.muted = false;
    } else {
      vidEl.muted = true;
    }
  };

  useEffect(() => {
    vidEl.addEventListener("volumechange", () => {
      if (vidEl.muted) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    });
  }, [vidEl]);

  return (
    <Tooltip tip={isMuted ? "Unmute" : "Mute"}>
      <Button
        className="size-8"
        icon={isMuted ? faVolumeSlash : faVolume}
        variant="secondary"
        onClick={toggleMute}
      />
    </Tooltip>
  );
}
