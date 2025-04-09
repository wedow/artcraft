import React, { useState } from "react";
import { a, useTransition } from "@react-spring/web";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { Button, ImageInput } from "components/common";
import { WorkIndicator } from "components/svg";
import { faImage } from "@fortawesome/pro-solid-svg-icons";
import { basicTransition } from "resources";
import "./CoverImageInput.scss";

interface Props {
  currentPath?: string;
  onClick: (x: any) => any;
  status: FetchStatus;
}

interface UploadCtrlProps {
  onClick: (x: any) => any;
  status: FetchStatus;
}

const UploadControl = ({ onClick, status }: UploadCtrlProps) => {
  const failure = status === FetchStatus.error;
  const success = status === FetchStatus.success;

  return status === FetchStatus.ready ? (
    <Button
      {...{
        className: "upload-control-btn",
        label: "Upload image",
        onClick,
        variant: "secondary",
      }}
    />
  ) : (
    <div {...{ className: "upload-control-indicator" }}>
      <WorkIndicator
        {...{
          failure,
          progressPercentage: 100,
          stage: success ? 2 : 1,
          success,
        }}
      />
      <span>{success ? "Cover image uploaded" : "Uploading ..."}</span>
    </div>
  );
};

export default function CoverImageInput({
  currentPath,
  onClick,
  status,
  ...rest
}: Props) {
  const [editingImg, editingImgSet] = useState(currentPath ? 0 : 1);
  const transitions = useTransition(
    editingImg,
    basicTransition({ enter: { opacity: 1.0, position: "absolute" } })
  );

  return (
    <div {...{ className: "fy-cover-img-input" }}>
      {transitions((style, i) =>
        !currentPath || i ? (
          <a.div {...{ className: "fy-cover-img-empty", style }}>
            <ImageInput
              {...{ ...rest, disabled: status > 1, placeholderIcon: faImage }}
            >
              <div {...{ className: "fy-cover-control" }}>
                <UploadControl {...{ onClick, status }} />
              </div>
            </ImageInput>
          </a.div>
        ) : (
          <a.div
            {...{
              className: "weight-initial-cover-img",
              style: { ...style, backgroundImage: `url(${currentPath})` },
            }}
          >
            <div>
              <Button
                {...{
                  className: "upload-control-btn",
                  label: "Change cover image",
                  onClick: () => editingImgSet(1),
                  variant: "secondary",
                }}
              />
            </div>
          </a.div>
        )
      )}
    </div>
  );
}
