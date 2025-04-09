import React from "react";
import { Direction, Range } from "react-range";
import { FontAwesomeIcon as Icon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
} from "@fortawesome/pro-solid-svg-icons";
import "./ZoomSlider.scss";

export interface ZoomSliderOnChangeEvent {
  target: { name?: string; type: "zoom"; value: number };
}

interface ZoomSliderProps {
  name?: string;
  horizontal?: boolean;
  onChange: (event: ZoomSliderOnChangeEvent) => void;
  value: number;
}

const renderTrack = ({ props: { style, ...props }, children }: any) => (
  <div {...{ ...props, className: "fy-zoom-slider-track", style }}>
    {children}
    <div {...{ className: "fy-zoom-slider-track-bar" }}></div>
  </div>
);

const thumb =
  (thumbTip = "") =>
  ({ props: { style, ...props } }: any) => {
    return (
      <div {...{ ...props, className: "fy-zoom-slider-thumb", style }}>
        {thumbTip}
      </div>
    );
  };

export default function ZoomSlider({
  name = "",
  horizontal,
  onChange: inChange,
  value,
}: ZoomSliderProps) {
  const onChange = (newVal: number[]) =>
    inChange({
      target: { ...(name && { name }), type: "zoom", value: newVal[0] },
    });

  // react-easy-crop returns a zoom value from 1 to 3, so a range of 2 when starting with 0

  const valueRange = 2;
  const incrementDecrement = valueRange / 100;

  return (
    <div
      {...{
        className: `fy-zoom-slider${
          horizontal ? " fy-zoom-slider-horizontal" : " fy-zoom-slider-vertical"
        }`,
      }}
    >
      <Icon
        {...{
          icon: faMagnifyingGlassPlus,
          onClick: () => {
            if (value < 3) {
              onChange([value + incrementDecrement]);
            }
          },
        }}
      />
      <div {...{ className: "fy-zoom-slider-container" }}>
        <Range
          {...{
            ...(!horizontal ? { direction: Direction.Up } : {}),
            min: 1,
            max: 3,
            onChange,
            step: 0.01,
            renderThumb: thumb(
              Math.round(((value - 1) / valueRange) * 100).toString() + "%"
            ),
            renderTrack,
            values: [value],
          }}
        />
      </div>
      <Icon
        {...{
          icon: faMagnifyingGlassMinus,
          onClick: () => {
            if (value > 1) {
              onChange([value - incrementDecrement]);
            }
          },
        }}
      />
    </div>
  );
}
