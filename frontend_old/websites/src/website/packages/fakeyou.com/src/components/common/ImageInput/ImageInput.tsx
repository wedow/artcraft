import React, { useState } from "react";
import { a, useSpring } from '@react-spring/web';
import { FileDetails, FileWrapper, FileLabel } from "components/common";
import { faImagePortrait } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "./ImageInput.scss";

const fileTypes = ["JPG", "GIF", "PNG"];

interface Props {
  blob?: string;
  children?: any;
  clear?: (file?: any) => void;
  disabled: boolean;
  file?: any;
  hideActions?: boolean;
  hideClearDetails?: boolean;
  inputProps?: any;
  onRest?: () => void;
  placeholderIcon?: IconDefinition;
  success?: boolean;
  submit?: () => void;
  working?: boolean;
  [x:string]: any;
}

const n = () => {};

export default function ImageInput({ blob = "", children, clear = n, disabled, file, hideActions, hideClearDetails, inputProps, onRest = n, placeholderIcon, success = false, submit = n, working = false, ...rest }: Props) {
  const [loaded,loadedSet] = useState<number>();
  const onLoad = () => loadedSet(1);
  const style = useSpring({
    config: { mass: 1, tension: 120, friction: 14 },
    onRest,
    opacity: loaded ? 1 : 0
  });

  return <FileWrapper {...{ disabled, fileTypes, panelClass: "image-upload-frame", ...inputProps, ...rest }}>
    <div {...{ className: "fy-image-uploader" }}>
      { file ? <>
        <a.img {...{ alt: "file preview", className: "file-preview", onLoad, src: blob, style }} />
        <FileDetails {...{ clear, disabled, file, hideClearDetails, icon: faImagePortrait }}/>
        { children }
      </> : <>
        { placeholderIcon ? <FontAwesomeIcon {...{ className: "placeholder-icon", icon: placeholderIcon }} /> :
          <svg {...{ className: "image-placeholder", height: 400, viewBox: "0 0 300 300", width: 400 }}>
            <path d="m152.42 226c41.8 0 69.49-43.57 73.21-90.87 3.78-47.97-26.06-87.13-75.69-87.13-49.64 0-79.28 39.15-75.69 87.13 3.72 49.79 36.37 90.87 78.17 90.87zm-29.19-50.93c1.62-1.51 4.15-1.42 5.65.2 4.1 4.41 15.31 6.97 21.88 6.97s17.77-2.56 21.88-6.97c1.5-1.62 4.04-1.71 5.65-.2 1.62 1.5 1.92 3.95.2 5.65-6.31 6.27-18.31 9.52-27.74 9.52s-22.16-3.54-27.74-9.52c-1.49-1.61-1.4-4.14.22-5.65zm115.25 112.93h-176.62c-37.67 0-38.24-17.41-27.56-26.36 21.49-18.01 57.18-23.64 114.81-23.64 60.01 0 96.24 4.84 117.41 24.06 10.09 9.16 7.67 25.94-28.04 25.94z"/>
          </svg> }
        <div {...{ className: "image-upload-label" }}>
          { !file && <FileLabel {...{ fileTypes }} /> }
        </div>
      </> }
    </div>
  </FileWrapper>;
};