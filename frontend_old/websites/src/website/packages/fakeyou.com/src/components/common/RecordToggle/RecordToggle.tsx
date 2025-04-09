import React from "react";
import { a, useSpring } from "@react-spring/web";
import "./RecordToggle.scss";

export interface RecordToggleEvent {
  target: {
    value: boolean;
  };
}

export interface RecordToggleProps {
  className?: string;
  counter?: number;
  onChange?: (e: RecordToggleEvent) => void;
  value: boolean;
}

export default function RecordToggle({
  className,
  counter = 0,
  onChange,
  value,
}: RecordToggleProps) {
  const hours = Math.floor(counter / 3600);
  const minutes = Math.floor((counter - hours * 3600) / 60);
  const seconds = counter - hours * 3600 - minutes * 60;

  const timeString =
    hours.toString().padStart(2, "0") +
    ":" +
    minutes.toString().padStart(2, "0") +
    ":" +
    seconds.toString().padStart(2, "0");

  const mainToggleStyle = useSpring({
    rx: value ? 1 : 8,
    size: value ? 14 : 16,
    xy: value ? 9 : 8,
  });

  const onClick = () => {
    if (onChange) {
      onChange({
        target: {
          value: !value,
        },
      });
    }
  };

  return (
    <button
      {...{
        className: `fy-record-toggle${className ? " " + className : ""}`,
        onClick,
        abc: 0,
        capturing: true,
      }}
    >
      <svg
        {...{
          className: value
            ? "fy-record-toggle-stop"
            : "fy-record-toggle-record",
        }}
      >
        <circle
          {...{
            cx: 16,
            cy: 16,
            r: 15,
          }}
        />
        <a.rect
          {...{
            x: mainToggleStyle.xy,
            y: mainToggleStyle.xy,
            height: mainToggleStyle.size,
            width: mainToggleStyle.size,
            rx: mainToggleStyle.rx,
          }}
        />
      </svg>
      {value ? timeString : "Record"}
    </button>
  );
}
