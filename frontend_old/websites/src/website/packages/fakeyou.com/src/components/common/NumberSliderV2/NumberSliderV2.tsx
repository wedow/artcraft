import React from "react";
import { Range } from "react-range";
import Tippy from "@tippyjs/react";
import { ButtonRevertToDefault, Label } from "components/common";
import { ButtonRevertToDefaultProps } from "../ButtonRevertToDefault/ButtonRevertToDefault";
import "./NumberSliderV2.scss";

interface Props{
  label?: string;
  thumbTip?: string;
  min: number;
  max: number;
  step?: number;
  initialValue?: number;
  value?: number;
  onChange?: (x:number) => void;
  required?: boolean;
  withRevert?: boolean;
  propsButtonRevertToDefault?: ButtonRevertToDefaultProps;
}

function roundToStep(x:number, step:number){
  return Math.round(x/step) * step;
}

const renderTrack = ({ props: { style, ...props }, children }: any) => (
  <div {...{ ...props, className: "fy-number-slider-track", style }}>
    {children}
  </div>
);

const thumb =
  (thumbTip = "") =>
  ({ props: { style, ...props } }: any) => {
    const key = Date.now()
    return (
      <Tippy
        {...{
          key,
          arrow: false,
          content: thumbTip,
          placement: "bottom",
          theme: "range-slider",
        }}
      >
        <div
          {...{ ...props, className: "fy-number-slider-thumb", style }}
        ></div>
      </Tippy>
    );
  };

export default function NumberSlider({
  label,
  thumbTip,
  min,
  max,
  step: stepProps,
  onChange: onChangeCallback,
  required,
  initialValue: initialValueProps,
  value,
  withRevert = false,
  propsButtonRevertToDefault,
}: Props) {

  const step = stepProps && stepProps <= max-min ? stepProps 
    : max-min >= 1 ? 1 : (max-min) / 10;
  const initialValue = initialValueProps !== undefined && initialValueProps <= max && initialValueProps >= min ? initialValueProps
  : value !== undefined && value <=max && value>=min ? value
  :max-min === step ? min : roundToStep((max+min)/2, step);

  function handleInputOnChange(e: React.ChangeEvent<HTMLInputElement>){
    if(onChangeCallback)onChangeCallback(Number.parseInt(e.target.value))
  }
  function handleRangeOnChange(rangeValue: number[]){
    if(onChangeCallback)onChangeCallback(rangeValue[0])
  }
  function handleRevert(iv:number){
    if(onChangeCallback)onChangeCallback(iv) 
  }
  return (
    <div>
      <Label {...{ label, required }} />
      <div className="d-flex g-2 align-items-center fy-number-slider">
        <input 
          className="fy-number-slider-value"
          type="number"
          {...{ min, max, step, value:value || initialValue}}
          onChange={handleInputOnChange}
        />
        <div className="fy-number-slider-range">
          <Range
            {...{min, max, step,
              onChange: handleRangeOnChange,
              renderThumb: thumb(thumbTip),
              renderTrack,
              thumbTip,
              values: [value || initialValue],
            }}
          />
        </div>
        {withRevert && 
          <ButtonRevertToDefault
            {...propsButtonRevertToDefault}
            initialValue={initialValue}
            onRevert={handleRevert}
          />
        }
        
      </div>
    </div>
  );
}
