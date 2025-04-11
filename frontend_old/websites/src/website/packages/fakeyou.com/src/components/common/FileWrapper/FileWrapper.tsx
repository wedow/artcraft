import React from "react";
import { useId } from 'hooks'; // replace with react v18
import './FileWrapper.scss'

interface Props {
  children?: JSX.Element|JSX.Element[];
  containerClass?: string;
  fileTypes?: string[];
  inputRef: any;
  noStyle?: boolean;
  onChange: (file?: any) => void;
  panelClass?: string;
  [x:string]: any;
};

export default function FileWrapper({ children, containerClass, fileTypes = [], inputRef, noStyle, onChange, panelClass, ...rest }: Props) {
  const id = 'file-input-' + useId();
  const accept = fileTypes.map((type,i) => `.${ type.toLowerCase() }`).join(",");

  const fileChange = (e: any) => {
    e.preventDefault();
    onChange({ target: { name: e.target?.name || "file-input", value: e.target.files[0] }});
  };
  const onDragDrop = (e: any) => { e.preventDefault(); e.stopPropagation(); };
  const onDragEvent = (onOff: number) => (e: React.DragEvent<HTMLDivElement>): void => {
    onDragDrop(e);
    e.currentTarget.classList[onOff ? "add" : "remove" ]("upload-zone-drag");
  };
  const onDrop = (e: any): void =>  {
    onDragDrop(e);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange({ target: { name: e.target?.name || "file-input", value: e.dataTransfer.files[0] }});
    }
  };

  const containerBaseClass = noStyle ? "-no-style" : "";
  const panelBaseClass = noStyle ? "" : "panel panel-inner d-flex align-items-center";

  return <div {...{ className: `fy-uploader${ containerBaseClass }${ containerClass ? " " + containerClass : "" }`, onDragLeave: onDragEvent(1), onDragOver: onDragEvent(0), onDrop }}>
    <input { ...{ accept, onChange: fileChange, type: "file", id, ref: inputRef, ...rest }} />
    <label {...{ className: `${ panelBaseClass }${ panelClass ? " " + panelClass : "" }`, htmlFor: id }} >
      { children }
    </label>
  </div>;
};
