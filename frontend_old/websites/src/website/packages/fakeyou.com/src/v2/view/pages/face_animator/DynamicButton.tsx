import React from "react";
import { a, useSpring, useTransition } from "@react-spring/web";
import { useHover } from "hooks";
import { baseColors } from "resources";
import "./DynamicButton.scss"

interface Props {
  children?: string|JSX.Element|JSX.Element[];
  className?: string;
  disabled?: boolean;
  key?: boolean;
  [x:string]: any;
}

export default function DynamicButton({ children, className, disabled, index = 0, key, slides = [], ...rest }: Props) {
  const [hover, hoverProps = {}] = useHover({});
  const style = useSpring({
    backgroundColor: hover ? baseColors.primary : baseColors.another,
    config: { tension: 130,  friction: 20 },
    opacity: disabled ? .5 : 1
  });

  const transitions = useTransition(index, {
    config: { tension: 130,  friction: 20 },
    from: { opacity: 0, position: "absolute" },
    enter: { opacity: 1, position: "relative" },
    leave: { opacity: 0, position: "absolute" },
  });

  return <a.button {...{ className: `fy-dynamic-button${ className ? " " + className : "" }`, disabled, style, ...hoverProps, ...rest }}>
       { transitions(({ opacity, position }, content, s, i) => {
          return <a.div {...{ className: `button-slide ${i}`, style: { opacity, position: position as any } }}>
            { slides[content] }
          </a.div>;
       }) }
  </a.button>;
};