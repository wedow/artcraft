import React from "react";
// import { a, useTransition } from '@react-spring/web';
// import { InputVcAudioPlayer } from "v2/view/_common/InputVcAudioPlayer";
import { FileDetails, FileLabel, FileWrapper } from 'components/common';
import { faFileAudio } from "@fortawesome/pro-solid-svg-icons";
import './AudioInput.scss'

const fileTypes = ["MP3", "WAV", "FLAC", "OGG"];

interface Props {
  blob?: string;
  children?: any;
  clear?: (file?: any) => void;
  file?: any;
  hideDetails?: boolean;
  hideClearDetails?: boolean;
  inputProps?: any;
  [x:string]: any;
}

const n = () => {};

export default function AudioInput({ children, clear = n, file, hideDetails, hideClearDetails, inputProps, ...rest }: Props) {
  return <div {...{ className: "fy-audio-uploader" }}>
    <FileWrapper {...{ fileTypes, ...inputProps, panelClass: "p-3", ...rest }}>
     { file ? <FileDetails {...{ clear, hideClearDetails, icon: faFileAudio, file }}/> : <FileLabel {...{ fileTypes }}/> }
    </FileWrapper>
      { children }
  </div>;
};