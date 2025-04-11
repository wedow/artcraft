import React, { useEffect } from "react";
import { useSpring } from "@react-spring/web";
import { FileDetails, FileWrapper, FileLabel } from "components/common";
import { faFileVideo, faVideo } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  //blob, clear, file, inputProps comes from file
  blob?: string;
  clear?: (file?: any) => void;
  file?: any;
  hideActions?: boolean;
  hideClearDetails?: boolean;
  inputProps?: any;
  onStateChange?: () => void;
  success?: boolean;
  submit?: () => void;
  working?: boolean;
  t: Function;
  [x: string]: any;
}

export default function UploadFieldVideo({
  blob = "",
  clear = () => {},
  file,
  hideActions,
  hideClearDetails,
  inputProps,
  onStateChange = () => {},
  success = false,
  submit = () => {},
  working = false,
  t,
  ...rest
}: Props) {
  useEffect(() => {
    //only fire for file unload
    //on file load is fired in video elements
    if (!file) onStateChange();
  }, [file, onStateChange]);

  const style = useSpring({
    config: { mass: 1, tension: 120, friction: 14 },
  });

  const fileTypes = ["MP4"];

  return (
    <FileWrapper {...{ fileTypes, panelClass: "", ...inputProps, ...rest }}>
      <div className="d-flex flex-column justify-content-center align-items-center w-100 h-100 overflow-hidden">
        {file ? (
          <>
            <FileDetails
              className="d-flex w-100 p-3"
              {...{ clear, file, hideClearDetails, icon: faFileVideo }}
            />
            <video
              controls
              src={blob}
              className="mh-100 mw-100 object-fit-cover"
              onLoadStart={onStateChange}
              {...{ style }}
            />
          </>
        ) : (
          <>
            <FileLabel
              className="
              upload-details
              d-flex w-100 p-3
            "
              {...{ fileTypes }}
            />
            <div className="ratio ratio-16x9">
              <div className="d-flex align-items-center justify-content-center">
                <FontAwesomeIcon
                  icon={faVideo}
                  className="opacity-25 display-1"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </FileWrapper>
  );
}
