import React, { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { faPlay, faPause } from "@fortawesome/pro-solid-svg-icons";
import Button from "components/common/Button";
import "./AudioPlayer.scss";
import { useAudioPlayerContext } from "./AudioPlayerContext";
import useOnScreen from "hooks/useOnScreen";

interface AudioPlayerProps {
  src: string;
  id: string;
}

export default function AudioPlayer({ src, id }: AudioPlayerProps) {
  const { currentPlayingId, setCurrentPlayingId } = useAudioPlayerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const waveSurferRef = useRef<WaveSurfer | null>(null);
  const isPlayerOnScreen = useOnScreen(waveformRef); //This stops the audio from playing when the player is not on screen

  useEffect(() => {
    if (!waveSurferRef.current && waveformRef.current) {
      const wavesurferInstance = WaveSurfer.create({
        container: waveformRef.current,
        height: 38,
        responsive: true,
        waveColor: "#cbcbcb",
        progressColor: "#fc8481",
        cursorColor: "#fc6b68",
        cursorWidth: 2,
        normalize: true,
      });

      waveSurferRef.current = wavesurferInstance;

      waveSurferRef.current.load(src);

      waveSurferRef.current.on("pause", () => {
        setIsPlaying(false);
      });

      waveSurferRef.current.on("play", () => {
        setIsPlaying(true);
        setCurrentPlayingId(id);
      });

      waveSurferRef.current.on("finish", () => {
        waveSurferRef.current?.pause();
      });
    }

    return () => {
      // Cleanup when component unmounts
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
      }
    };
  }, [src, setCurrentPlayingId, id]);

  useEffect(() => {
    if (currentPlayingId !== id && isPlaying) {
      setIsPlaying(false);
      waveSurferRef.current?.pause();
    }
  }, [currentPlayingId, id, isPlaying]);

  useEffect(() => {
    if (!isPlayerOnScreen && isPlaying) {
      waveSurferRef.current?.pause();
    }
  }, [isPlayerOnScreen, isPlaying]);

  const togglePlayPause = (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    if (waveSurferRef.current) {
      if (!isPlaying) {
        setCurrentPlayingId(id);
      }
      waveSurferRef.current.playPause();
    }
  };

  const playButtonIcon = isPlaying ? faPause : faPlay;

  return (
    <div className="d-flex gap-3 align-items-center">
      <Button
        square={true}
        icon={playButtonIcon}
        onClick={togglePlayPause}
        small={true}
      />
      <div ref={waveformRef} className="w-100" />
    </div>
  );
}
