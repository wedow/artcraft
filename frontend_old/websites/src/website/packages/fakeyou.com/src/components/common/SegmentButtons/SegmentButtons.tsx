import React from "react";
import { Label } from "components/common";
import "./SegmentButtons.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, fa0 } from "@fortawesome/pro-solid-svg-icons";

type SegmentButtonsValue = string | number;

export interface SegmentButtonsOptions {
  disabled?: boolean;
  label: string;
  icon?: IconDefinition | undefined;
  subLabel?: string;
  value: SegmentButtonsValue;
}

interface SegmentButtonsProps {
  className?: string;
  label?: string;
  name?: string;
  onChange?: any;
  options?: SegmentButtonsOptions[];
  value?: SegmentButtonsValue;
  icon?: IconDefinition | undefined;
  disabled?: boolean;
  highlight?: boolean;
}

export default function SegmentButtons({
  className,
  label,
  name,
  icon,
  onChange,
  options = [],
  value: inValue = "",
  disabled = false,
  highlight = false,
}: SegmentButtonsProps) {
  // const onClick = ({ target }: any) => onChange();
  return (
    <div>
      {label && <Label {...{ label, disabled: disabled }} />}
      <ul
        {...{
          className: `fy-segment-buttons mb-0${
            className ? " " + className : ""
          }`,
        }}
      >
        {options.map(
          (
            {
              disabled: disabledOpt,
              label = "",
              value = "",
              icon = fa0,
              subLabel = "",
            },
            key: number
          ) => {
            const segmentClass = `${
              value === inValue
                ? `fy-selected-segment${highlight && " fy-highlighted-segment"}`
                : ""
            }${disabled || disabledOpt ? " fy-disabled-segment" : ""}`;

            return (
              <li
                {...{
                  className: segmentClass,
                  key,
                  onClick: ({ target }: any) =>
                    onChange({ target: { name, type: "option", value } }),
                }}
              >
                {icon === fa0 ? null : (
                  <FontAwesomeIcon
                    icon={icon}
                    className="fy-segment-button-icon"
                  />
                )}
                {label}
                {subLabel && <p>{subLabel}</p>}
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
}
