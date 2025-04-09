import React from "react";
import { animated, useSpring } from "@react-spring/web";
import { Panel, Spinner } from "components/common";
import { springs } from "resources";
import DynamicButton from "./DynamicButton";

const ProgressLi = ({
  children,
  disabled = false,
}: {
  children?: any;
  disabled?: boolean;
}) => {
  const style = useSpring({
    ...springs.soft,
    opacity: disabled ? 0.25 : 1,
  });
  return (
    <animated.li {...{ style }}>
      <svg>
        <circle {...{ cx: 16, cy: 16, r: 15, strokeWidth: "2" }} />
        {
          <polyline
            {...{
              fill: "none",
              points: "9.5 18 14.5 22 22.5 12",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: "4",
            }}
          />
        }
      </svg>
      {children}
    </animated.li>
  );
};

export default function FaceAnimatorTitle({ ...rest }) {
  const {
    audioProps,
    audioReady,
    clearInputs,
    imageProps,
    imageReady,
    indexSet,
    page,
    presetAudio,
    preferPresetAudio,
    submit,
    t,
  } = rest;
  const noAudio =
    (preferPresetAudio && !presetAudio) ||
    (!preferPresetAudio && (!audioReady || !audioProps.file));
  const noImg = !imageReady || !imageProps.file;
  const incomplete = noAudio || noImg;

  const working = imageProps.working && audioProps.working;

  const slides = [t("inputs.generate"), <Spinner />, t("inputs.makeAnother")];

  const onClick = () => {
    if (page === 2) {
      imageProps.clear();
      audioProps.clear();
      clearInputs();
      indexSet(0);
    } else if (!incomplete && !working) submit();
  };

  return (
    <Panel clear={true} className="mt-3 mb-5">
      <div {...{ className: "progress-header" }}>
        <h1
          {...{
            className: "fw-bold text-center text-md-start progress-heading",
          }}
        >
          {t("headings.title")}
        </h1>
        <ul {...{ className: "async-progress-tracker py-3 py-lg-0" }}>
          <ProgressLi {...{ disabled: noImg }}>
            {t("headings.image")}
          </ProgressLi>
          <ProgressLi {...{ disabled: noAudio }}>
            {t("headings.audio")}
          </ProgressLi>
        </ul>
        <DynamicButton
          {...{
            className: "face-animation-submit",
            disabled: incomplete || working,
            onClick,
            slides,
            index: page,
          }}
        />
        <p {...{ className: "progress-description fa-light-txt" }}>
          {t("headings.subtitle")}
        </p>
      </div>
    </Panel>
  );
}
