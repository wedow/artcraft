import { Transition } from "@headlessui/react";
import React, { useState, useRef, useEffect, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface SliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step: number;
  className?: string;
  showTooltip?: boolean;
  tooltipContent?: ReactNode;
  suffix?: string;
}

export const Slider = ({
  min,
  max,
  value,
  onChange,
  step,
  className,
  showTooltip,
  tooltipContent,
  suffix,
}: SliderProps) => {
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHandleTooltip, setShowHandleTooltip] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const updatePosition = (x: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const fraction = (x - rect.left) / rect.width;
    const newValue = fraction * (max - min) + min;
    const roundedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.min(Math.max(roundedValue, min), max);
    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setShowHandleTooltip(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    updatePosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    updatePosition(e.clientX);
  };

  const handleMouseUp = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setShowHandleTooltip(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseEnter = () => {
    if (!isDragging) {
      setShowHandleTooltip(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setShowHandleTooltip(false);
    }
  };

  const percentage = ((localValue - min) / (max - min)) * 100;
  const displayValue =
    localValue.toFixed(step.toString().split(".")[1]?.length || 0) +
    (suffix || "");

  return (
    <div
      ref={sliderRef}
      className={twMerge(
        "relative h-2.5 w-full cursor-pointer rounded-full bg-gray-500",
        className,
      )}
      onMouseDown={handleMouseDown}
    >
      <div
        className="absolute h-2.5 rounded-full bg-primary"
        style={{ width: `${percentage}%` }}
      ></div>
      <div
        className={twMerge(
          "absolute -top-1 h-[18px] w-[18px] -translate-x-1/2 transform rounded-full bg-gray-200 transition-colors",
          isDragging ? "bg-white" : "bg-gray-300 hover:bg-white",
        )}
        style={{ left: `${percentage}%` }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {showTooltip && (
        <Transition
          as={"div"}
          show={showHandleTooltip}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0"
        >
          <div
            className="absolute -top-8 z-10 rounded-md bg-ui-panel px-2 py-1 text-xs text-black shadow-lg"
            style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
          >
            {tooltipContent ? tooltipContent : displayValue}
          </div>
        </Transition>
      )}
    </div>
  );
};
