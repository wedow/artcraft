import React from "react";
import { a, useSpring } from "@react-spring/web";

interface Props {
  checked?: boolean;
}

export default function Check({ checked }: Props) {
  const style = useSpring({
    config: { tension: 280, friction: 20 },
    strokeDasharray: checked ? "28, 0" : "0,28",
  });
  return (
    <a.polyline
      {...{
        fill: "none",
        points: "6,13 10,17 18,7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: "3",
        strokeDashoffset: 4,
        // ...rest,
        style,
      }}
    />
  );
}
