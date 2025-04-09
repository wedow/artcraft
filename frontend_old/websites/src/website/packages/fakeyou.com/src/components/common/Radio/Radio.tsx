import React from 'react';
import { useId } from "hooks";
import makeClass from "resources/makeClass";
import "./Radio.scss";

interface Props {
  className?: string;
  label?: string;
  name?: string;
  onChange?: any;
  value?: string;
}

export default function Radio({ className = "", label = "", name = "", onChange = () => {}, value }: Props) {
  const id = "checkbox-" + useId();
  return <div {...{ ...makeClass("fy-radio-input",className), onChange }}>
    <input {...{ checked: value === name, id, type: "radio", name, value: name }}/>
    { label && <label {...{ class: "form-check-label", for: id }}>{ label }</label> }
  </div>;
};