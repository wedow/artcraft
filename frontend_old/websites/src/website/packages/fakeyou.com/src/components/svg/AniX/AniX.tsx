import React from 'react';
import { a, useSpring } from "@react-spring/web";

interface Props {
  checked?: boolean;
}

export default function AniX({ checked = false }: Props) {
   const sharedStyle = {
    config: { tension: 280, friction: 45 },
    strokeDashoffset: 1,
    strokeDasharray: checked ? '13, 0' : '0,13'
  };
  const line1 = useSpring({
    ...sharedStyle,
  });
  const line2 = useSpring({
    delay: 450,
    ...sharedStyle
  });

  return <>
    <a.line {...{ style: line1, x1: 14, y1: 14, x2: 22, y2: 22 }}/>
    <a.line {...{ style: line2, x1: 22, y1: 14, x2: 14, y2: 22 }}/>
  </>;
};