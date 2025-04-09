import React from "react";
import { a, useTransition } from "@react-spring/web";
import { InputVcAudioPlayer } from "v2/view/_common/InputVcAudioPlayer";
import { FileActions } from "components/common";
import "./AudioBlobPreview.scss";

interface Props {
  blob?: any,
  clear?: any,
  file?: any,
  hideActions: boolean,
  onRest?: () => void,
  success?: any,
  submit?: () => void,
  working?: any
}

export default function AudioBlobPreview({ clear, blob, file, hideActions, onRest, success, submit, working }: Props) {
	const transitions = useTransition(file, {
    config: { tension: 120,  friction: 15 },
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    onRest,
  });

  return transitions((style, i) => i ? <a.div {...{ className: "audio-details", style }}>
    <div {...{ className: "fy-audio-blob panel" }}>
      <InputVcAudioPlayer {...{ filename: blob as string }}/>
    </div>
    {
      !hideActions && <FileActions {...{ clear, success, submit, working }}/>
    }
  </a.div> : null );
};