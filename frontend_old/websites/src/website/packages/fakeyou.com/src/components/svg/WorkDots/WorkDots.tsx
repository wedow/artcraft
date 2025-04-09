import React from "react";
import { a, useTransition } from "@react-spring/web";
import { basicTransition } from "resources";
import { AnimationEvents } from "hooks";

type Label = string | number;

interface Props {
  debug?: boolean;
  events: AnimationEvents;
  labels: Label[];
  noPad?: boolean;
  index: number;
}

export default function WorkDots({
  debug,
  events,
  labels = [],
  noPad,
  index,
}: Props) {
  const transitions = useTransition(
    index,
    basicTransition({
      ...events,
    })
  );

  if (debug) console.log("WorkDots ... Debug", index);

  return transitions((style: any, i: number, state: any) => {
    // let isLeaving = state.phase === "leave";
    const content = (txt: Label) => {
      return (
        <a.div
          {...{
            className: "fy-workdots-label",
            style: {
              ...style,
              ...(!noPad ? { right: "12px" } : {}),
            },
          }}
        >
          {txt !== undefined ? (
            txt
          ) : (
            <svg {...{ className: "fy-workdots" }}>
              <circle cx="2" cy="8" r="2" />
              <circle cx="8" cy="8" r="2" />
              <circle cx="14" cy="8" r="2" />
            </svg>
          )}
        </a.div>
      );
    };
    return [content(""), ...labels.map((label: Label, i) => content(label))][i];
  });
}
