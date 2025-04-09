import React from "react";
import { a, useSpring } from "@react-spring/web";
import { circle } from "../sharedSVGProps";

interface Props {
  className?: string;
  max?: number;
  progressPercentage: number;
  stage: number;
}

export default function DashedCircle({
  className = "",
  max = 87,
  progressPercentage,
  stage = 0,
}: Props) {
  const progressBar = (max - 16) * (progressPercentage / 100);
  const progressSegment = progressBar / 3;

  const dashes = [
    // the arity (amount of numbers) must remain the same or react-spring will freakout
    `1 7 1 7 1 70`, // UKNOWN / PENDING - 3x 1pt strokes with 7 point gaps, then a big 70pt gap
    `${progressSegment} 0 ${progressSegment} 0 ${progressSegment} ${
      max - progressBar
    }`, // STARTED / ATTEMPT_FAILED - 6pt strokes with 0pt gaps to appear as one, big gap
    `0 0 ${max} 0 0 0`, // COMPLETE_SUCCESS / COMPLETE_FAILURE / DEAD - One big 50pt stroke
  ];
  const style = useSpring({
    config: { tension: 280, friction: 60 },
    opacity: [0.5, 1, 1][stage],
    strokeDasharray: dashes[stage],
  });

  return <a.circle {...{ ...circle, className, style }} />;
}
