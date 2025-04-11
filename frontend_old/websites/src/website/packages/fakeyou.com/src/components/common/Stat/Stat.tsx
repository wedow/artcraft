import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

const MILLION: number = 1000000;
const THOUSAND: number = 1000;

interface Props {
  count: number;
  icon?: IconProp;
}

export default function Stat(props: Props) {
  if (isNaN(props.count) || props.count < 0) {
    return null;
  }
  let friendlyCount = toHumanNumber(props.count);

  let icon = <></>;
  if (props.icon !== undefined) {
    icon = <FontAwesomeIcon icon={props.icon} />;
  }

  return (
    <>
      {props.count !== null ? (
        <span className="d-flex align-items-center gap-1 fs-7 text-white">
          {icon}
          {friendlyCount}
        </span>
      ) : null}
    </>
  );
}

function toHumanNumber(count: number): string {
  if (count > MILLION) {
    let digits = (count / MILLION).toFixed(2);
    return `${digits}m`;
  } else if (count > THOUSAND) {
    let digits = (count / THOUSAND).toFixed(2);
    return `${digits}k`;
  } else {
    return count.toString();
  }
}
