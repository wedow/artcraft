import React, { Fragment } from "react";
import { components } from "react-select";

// Problem - search label isn't present when searching, confusing users that don't realize it's 
// a text search box.
// Ticket: https://github.com/JedWatson/react-select/issues/1351
// Solution from: https://codesandbox.io/s/hide-selected-on-focus-react-select-n05yi2?file=/src/App.js:531-774

export function FixedSingleValueSelectOption(props: any) {
  const { children, ...rest } = props;
  const { selectProps } = props;
  if (selectProps.menuIsOpen) return <Fragment></Fragment>;
  return <components.SingleValue {...rest}>{children}</components.SingleValue>;
}