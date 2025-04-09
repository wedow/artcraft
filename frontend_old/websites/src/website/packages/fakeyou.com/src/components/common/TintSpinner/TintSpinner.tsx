import React from "react";
import { a, useTransition } from "@react-spring/web";
import { basicTransition } from "resources";
import { Spinner } from "components/common";
import "./TintSpinner.scss";

interface Props {
  busy?: boolean;
}

export default function TintSpinner({ busy }: Props) {
  const transitions = useTransition(busy, basicTransition({}));

  return transitions((style, i) => busy && <a.div {...{ className: "fy-tint-spinner", style }}><Spinner /></a.div>);
};