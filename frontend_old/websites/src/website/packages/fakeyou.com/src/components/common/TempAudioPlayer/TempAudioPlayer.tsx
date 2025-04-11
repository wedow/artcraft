import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button, TempSelect } from "components/common";
import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import {
  faPlay,
  faPause,
  faRepeat,
  faArrowRight,
} from "@fortawesome/pro-solid-svg-icons";

interface Props {
  actions?: any;
  mediaFile?: MediaFile;
}

export default function TempAudioPlayer({ actions = [], mediaFile }: Props) {
  const ref = useRef(null);
  const [finished, finishedSet] = useState(false);
  const [initialized, initializedSet] = useState(false);
  const [playing, playingSet] = useState(false);
  const [repeat, repeatSet] = useState(false);
  const [speed, speedSet] = useState(1);
  const waveSurferRef = useRef<any>({ playing: () => false });
  const { mainURL } = MediaLinks(mediaFile?.media_links);

  const options = [
    { label: "x.5", value: 0.5 },
    { label: "x1", value: 1 },
    { label: "x1.5", value: 1.5 },
  ];

  const baseActions = [
    {
      icon: playing ? faPause : faPlay,
      onClick: () => {
        playingSet(!waveSurferRef.current.isPlaying());
        waveSurferRef.current.playPause();
      },
      square: true,
    },
    {
      icon: repeat ? faArrowRight : faRepeat,
      onClick: () => {
        repeatSet(!repeat);
      },
      square: true,
      variant: "secondary",
    },
    {
      options,
      onChange: ({ target }: any) => {
        waveSurferRef.current.setPlaybackRate(target.value);
        speedSet(target.value);
      },
      value: speed,
    },
    ...actions,
  ];

  useEffect(() => {
    if (!initialized && ref.current && mediaFile) {
      initializedSet(true);
      const waveSurfer = WaveSurfer.create({
        container: ref.current || "",
        height: 200,
        responsive: true,
        waveColor: "#cbcbcb",
        progressColor: "#fc8481",
        cursorColor: "#fc6b68",
        cursorWidth: 2,
        normalize: true,
      });
      waveSurfer.load(mainURL);
      waveSurfer.on("ready", () => {
        waveSurferRef.current = waveSurfer;
      });
      waveSurfer.on("finish", () => {
        finishedSet(true);
      });
    }

    if (finished) {
      finishedSet(false);
      if (!repeat) {
        playingSet(false);
      } else {
        waveSurferRef.current.playPause();
      }
    }
  }, [finished, initialized, mainURL, mediaFile, repeat]);

  return (
    <div {...{ className: "fy-audio-player" }}>
      <div {...{ ref }}></div>
      <div className="d-flex justify-content-center gap-2 mt-3">
        {baseActions.map((action, key) =>
          action.options ? (
            <TempSelect {...{ ...action, key }} />
          ) : (
            <Button {...{ ...action, key }} />
          )
        )}
      </div>
    </div>
  );
}
