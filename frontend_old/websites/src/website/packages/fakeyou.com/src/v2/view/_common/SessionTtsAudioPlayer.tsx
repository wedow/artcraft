import React, { useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import Wavesurfer from "react-wavesurfer.js";

interface Props {
  filename: string;
}

function SessionTtsAudioPlayer(props: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  const handleTogglePlay = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleFinish = useCallback(() => {
    setIsPlaying(false);
    setPosition(0);
    return [setIsPlaying, setPosition];
  }, []);

  let playButtonText = <FontAwesomeIcon icon={faPlay} />;

  if (isPlaying) {
    playButtonText = (
      <>
        <FontAwesomeIcon icon={faPause} />
      </>
    );
  }

  return (
    <div className="d-flex w-100 align-items-center gap-3 zi-1">
      <button
        className="btn btn-primary btn-session-tts-play align-items-center justify-content-center"
        onClick={() => handleTogglePlay()}
        type="button"
      >
        {playButtonText}
      </button>
      <div className="w-100 h-100 overflow-hidden">
        <Wavesurfer
          key={props.filename}
          onFinish={handleFinish}
          pos={position}
          src={props.filename}
          // barWidth={2}
          // barRadius={1}
          // barGap={2}
          // barMinHeight={1}
          // barHeight={2}
          height={36}
          progressColor="#fc8481"
          waveColor="#b09e9e"
          cursorColor="#fc8481"
          playing={isPlaying}
          responsive={true}
          normalize={true}
        />
      </div>
    </div>
  );
}

export { SessionTtsAudioPlayer };
