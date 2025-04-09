import React from 'react';
import { a, useSpring } from "@react-spring/web";

interface Props {
  checked?: boolean;
}

export default function AniX({ checked = false }: Props) {
   const sharedStyle = {
   	transform: `translateX(${ checked ? 4 : 0 }px)`,
    config: { tension: 280, friction: 45 },
    strokeDashoffset: 1,
  };
  const line1 = useSpring({
    ...sharedStyle,
    strokeDasharray: checked ? '9.5,12,0' : '18,0,0'
  });
  const line2 = useSpring({
    // delay: 450,
    ...sharedStyle,
    strokeDasharray: checked ? '0,9.5,12' : '0,0,18'
  });

  return <>
	<a.line {...{ style: line1, x1: 12, y1: 12, x2: 24, y2: 24 }}/>
    <a.line {...{ style: line2, x1: 24, y1: 12, x2: 12, y2: 24 }}/>
  </>;
};