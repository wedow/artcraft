import React from "react";
import { a, useSpring } from "@react-spring/web";
import { AniX, Check, DashedCircle } from "components/svg";
import { circle } from "../sharedSVGProps";
import "./WorkIndicator.scss";

interface WorkIndicatorProps {
  className?: string;
  failure: boolean;
  max?: number;
  progressPercentage: number;
  stage: number;
  showPercentage?: boolean;
  success: boolean;
}

interface WorkIndicatorWrapperProps extends WorkIndicatorProps {
  label?: string;
}

const WorkIndicatorSpinner = ({
  className,
  failure = false,
  max,
  progressPercentage,
  stage = 0,
  showPercentage,
  success = false,
  ...rest
}: WorkIndicatorProps) => {
  const style = useSpring({
    opacity: showPercentage ? 1 : 0,
  });

  return (
    <div
      {...{ className: `work-indicator${className ? " " + className : ""}` }}
    >
      <a.div {...{ className: "work-indicator-progress", style }}>
        {progressPercentage}%
      </a.div>
      <svg {...{ className: "work-indicator-circle", ...rest }}>
        <circle {...{ ...circle, className: "work-indicator-circle-track" }} />
        <DashedCircle
          {...{
            className: "work-indicator-circle-marker",
            max,
            progressPercentage,
            stage,
          }}
        />
        <AniX {...{ checked: failure }} />
        <Check {...{ checked: success }} />
      </svg>
    </div>
  );
};

export default function WorkIndicator({
  label,
  ...rest
}: WorkIndicatorWrapperProps) {
  return label ? (
    <div {...{ className: "work-indicator-label" }}>
      {label}
      <WorkIndicatorSpinner {...rest} />
    </div>
  ) : (
    <WorkIndicatorSpinner {...rest} />
  );
}
