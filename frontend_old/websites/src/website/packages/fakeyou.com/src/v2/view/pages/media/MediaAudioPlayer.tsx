import React, { useEffect, useState, memo } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  faPlay,
  faPause,
  faRepeat,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";
import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import Button from "components/common/Button";

enum PlaybackSpeed {
  HALF,
  NORMAL,
  DOUBLE,
}

interface MediaAudioPlayerProps {
  mediaFile: MediaFile;
}

const MediaAudioPlayer = memo(({ mediaFile }: MediaAudioPlayerProps) => {
  let [isPlaying, setIsPlaying] = useState(false);
  let [isRepeating, setIsRepeating] = useState(false);
  let [playbackSpeed, setPlaybackSpeed] = useState(PlaybackSpeed.NORMAL);
  let [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null);

  useEffect(() => {
    const wavesurferInstance = WaveSurfer.create({
      container: "#waveform",
      height: 200,
      responsive: true,
      waveColor: "#cbcbcb",
      progressColor: "#fc8481",
      cursorColor: "#fc6b68",
      cursorWidth: 2,
      normalize: true,
    });

    setWaveSurfer(wavesurferInstance);
  }, []);

  useEffect(() => {
    const { mainURL } = MediaLinks(mediaFile.media_links);

    if (waveSurfer) {
      waveSurfer.load(mainURL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waveSurfer, mediaFile.public_bucket_path]);

  useEffect(() => {
    if (waveSurfer) {
      waveSurfer.unAll();
      waveSurfer.on("pause", () => {
        setIsPlaying(waveSurfer!.isPlaying());
      });
      waveSurfer.on("play", () => {
        setIsPlaying(waveSurfer!.isPlaying());
      });
      waveSurfer.on("finish", () => {
        if (waveSurfer && isRepeating) {
          waveSurfer!.play();
        }
      });
    }
  }, [waveSurfer, isRepeating]);

  const togglePlayPause = () => {
    if (waveSurfer) {
      waveSurfer.playPause();
    }
  };

  const toggleIsRepeating = () => {
    setIsRepeating(!isRepeating);
  };

  const togglePlaybackSpeed = () => {
    let nextSpeed = PlaybackSpeed.NORMAL;
    switch (playbackSpeed) {
      case PlaybackSpeed.NORMAL:
        nextSpeed = PlaybackSpeed.DOUBLE;
        waveSurfer!.setPlaybackRate(1.5);
        break;
      case PlaybackSpeed.DOUBLE:
        nextSpeed = PlaybackSpeed.HALF;
        waveSurfer!.setPlaybackRate(0.5);
        break;
      case PlaybackSpeed.HALF:
        nextSpeed = PlaybackSpeed.NORMAL;
        waveSurfer!.setPlaybackRate(1.0);
        break;
    }
    setPlaybackSpeed(nextSpeed);
  };

  let playButtonIcon = isPlaying ? faPause : faPlay;
  let repeatButtonIcon = isRepeating ? faRepeat : faArrowRight;
  let speedButtonText =
    playbackSpeed === PlaybackSpeed.NORMAL
      ? "1x"
      : playbackSpeed === PlaybackSpeed.DOUBLE
        ? "2x"
        : "0.5x";

  return (
    <div>
      <div id="waveform"></div>
      <div className="d-flex justify-content-center gap-2 mt-3">
        <Button square={true} icon={playButtonIcon} onClick={togglePlayPause} />
        <Button
          tooltip="Toggle Repeat"
          variant="secondary"
          square={true}
          icon={repeatButtonIcon}
          onClick={toggleIsRepeating}
        />
        <Button
          tooltip="Speed"
          label={speedButtonText}
          variant="secondary"
          onClick={togglePlaybackSpeed}
        />
      </div>
    </div>
  );
});

export default MediaAudioPlayer;
