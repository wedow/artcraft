import { useState } from "react";

type hoverEventFn = (e?: any) => void;

interface UseHoverParams {
  onMouseEnter?: hoverEventFn;
  onMouseLeave?: hoverEventFn;
}

export type HoverValues = [
  boolean,
  {
    onMouseEnter: hoverEventFn;
    onMouseLeave: hoverEventFn;
  },
];

export default function useHover({
  onMouseEnter = () => {},
  onMouseLeave = () => {},
}: UseHoverParams): HoverValues {
  const [hover, hoverSet] = useState(false);
  const onHover = (x: boolean) => (e: any) => {
    hoverSet(x);
    x ? onMouseEnter(e) : onMouseLeave(e);
  };
  return [hover, { onMouseEnter: onHover(true), onMouseLeave: onHover(false) }];
}
