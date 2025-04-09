import React from "react";
import { Range } from "react-range";
import Tippy from "@tippyjs/react";

interface PitchShiftProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onPitchChange: (value: number) => void;
}

function PitchShiftComponent({
  min,
  max,
  step,
  value,
  onPitchChange,
}: PitchShiftProps) {
  
  const handlePitchChange = (newValue: number[]) => {
    onPitchChange(newValue[0]);
  };

  const renderTrack = ({ props, children }: any) => (
    <div
      {...props}
      style={{
        ...props.style,
        height: "8px",
        width: "100%",
        backgroundColor: "#4f4f66",
        borderRadius: "4px",
      }}
    >
      {children}
    </div>
  );

  const renderThumb = ({ props, isDragged, isHovered }: any) => (
    <Tippy
      content="Semitones"
      placement="bottom"
      theme="range-slider"
      arrow={false}
    >
      <div
        {...props}
        style={{
          ...props.style,
          height: "22px",
          width: "22px",
          borderRadius: "50%",
          backgroundColor: isHovered ? "#fff" : "#e66462",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          outline: "none",
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.15)", // Add soft shadow on hover
        }}
      ></div>
    </Tippy>
  );

  return (
    <>
      <div className="d-flex gap-3 align-items-center">
        <div className="flex-grow-1">
          <Range
            step={step}
            min={min}
            max={max}
            values={[value]} // Changed from `values` to `[value]`
            onChange={handlePitchChange}
            renderTrack={renderTrack}
            renderThumb={renderThumb}
          />
        </div>
        <input
          className="form-control range-slider-value"
          value={value.toFixed(0)}
          disabled
        ></input>
      </div>
    </>
  );
}

export default PitchShiftComponent;
