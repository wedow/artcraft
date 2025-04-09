import React from "react";
import { a, useSpring } from "@react-spring/web";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/pro-solid-svg-icons";
import "./FileDetails.scss";

interface Props {
  clear?: (file?: any) => void;
  disabled?: boolean;
  file?: any;
  hideClearDetails?: boolean;
  icon?: any;
  className?: string;
}

export default function FileDetails({
  className,
  clear = () => {},
  disabled,
  file,
  hideClearDetails,
  icon,
}: Props) {
  const fileSize =
    file && file.size >= 1024 * 1024
      ? (file.size / 1024 / 1024).toFixed(2) + " MB"
      : file
        ? `${Math.floor(file.size / 1024)} KB`
        : null;

  const style = useSpring({
    config: { mass: 1, tension: 120, friction: 14 },
    opacity: disabled ? 0 : 1,
  });

  return (
    <a.div
      {...{
        className: `fy-uploader-layout upload-details ${
          className ? " " + className : ""
        }`,
        style,
      }}
    >
      {icon && <Icon {...{ className: "fy-uploader-layout-icon", icon }} />}
      <div>
        <div {...{ className: "filename d-flex flex-column" }}>
          {file.name.slice(0, file.name.lastIndexOf("."))}

          <span className="opacity-50">
            {`${file.name
              .split(".")
              .pop()
              .toUpperCase()} file size: ${fileSize}`}
          </span>
        </div>
      </div>
      {!hideClearDetails && (
        <button
          {...{
            className:
              "upload-details-clear btn btn-destructive align-items-center justify-content-center",
            onClick: e => {
              e.preventDefault();
              clear();
            },
          }}
        >
          <Icon {...{ icon: faTrash }} />
        </button>
      )}
    </a.div>
  );
}
