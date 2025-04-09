import React, { useState } from "react";
import { a, useTransition } from "@react-spring/web";

interface Slide {
  component: React.ElementType,
  props?: any
}

interface Props {
  index: number;
  slides: Slide[]
}

interface AniProps {
  animating: boolean,
  className: string,
  isLeaving: boolean,
  render: any,
  style: any
}

const AniWrap = ({ animating, className, isLeaving, render: Render, style, ...rest }: AniProps) => <a.div {...{
  className: `fy-slide-wrapper${ className ?  " " + className : "" }`,
  style
}}>
    <Render {...{ ...rest, animating }} />
  </a.div>;

export default function useSlides({ index, slides }: Props) {
  const [animating,animatingSet] = useState(false);
  const transitions = useTransition(index, {
    config: { mass: 1, tension: 80, friction: 10 },
    from: { opacity: 0, transform: `translateX(${ 5 }rem)` },
    enter: { opacity: 1, transform: `translateX(0)` },
    leave: { opacity: 0, transform: `translateX(${ 5 }rem)` },
    onRest: () => animatingSet(false),
    onStart: () => animatingSet(true)
  });

  return transitions((style: any, i: number, state: any) => {
    let isLeaving = state.phase === "leave";
    let sharedProps = { animating, isLeaving, style };

    return slides.map(({ component, props }, i) => <AniWrap {...{ ...props, ...sharedProps, render: component }}/>)[i];
  });    
};