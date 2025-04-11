import React from 'react';
import { a, useTransition } from "@react-spring/web";
import { Spinner } from "components/common";
import { springs } from "resources";
import { FaceAnimatorSlide } from "../FaceAnimatorTypes";

export default function FaceAnimatorWorking({ audioProps, imageProps, index, style, t }: FaceAnimatorSlide) {
  const workStatus = [
    "",
    t("status.uploadingAudio"),
    t("status.uploadingImage"),
    t("status.requestingAnimation"),
    "",
  ];

  const transitions = useTransition(index, {
    ...springs.soft,
    from: { opacity: 0, position: "absolute" },
    enter: { opacity: 1, position: "relative" },
    leave: { opacity: 0, position: "absolute" },
  });
  return <a.div {...{ className: "lipsync-working", style }}>
    <div {...{ className: "lipsync-working-notice" }}>
      <h2 {...{ className: "working-title" }}>
        {" "}
        {transitions(({ opacity, position }, i) => {
          return (
            <a.span
              {...{
                className: "working-title-text",
                style: { opacity, position: position as any },
              }}
            >
              {workStatus[index]} ...
            </a.span>
          );
        })}
      </h2>
      <Spinner />
    </div>
  </a.div>;
};