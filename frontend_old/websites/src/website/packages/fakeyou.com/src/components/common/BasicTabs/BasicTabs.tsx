import React from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Tab {
  icon?: IconDefinition,
  label: string,
  value: any
}

interface Props {
  disabled?: boolean,
  name?: string,
  onChange: (e: any) => any,
  tabs: Tab[],
  value: any
}

export default function BasicTabs({ disabled, name = "", onChange, tabs, value: currentValue }: Props) {
  const tabSelect = (value: any) => () => {
    if (!disabled) {
      onChange({ target: { name, type: "select", value } });
    }
  };

  return <ul className="nav nav-tabs">
    { 
      tabs.map(({ icon, label, value },key) => <li {...{
        className: "nav-item",
        onClick: tabSelect(value),
      }}>
        <div {...{
          className: `nav-link fs-6 px-3 px-lg-4 ${ value === currentValue ? "active" : "" }`
        }}>
          { icon && <FontAwesomeIcon {...{ className: "me-2", icon }}/> }
          { label }
        </div>
      </li>)
    }
  </ul>;
};