// src/SliderWithIndicator.tsx
import React, { useState, useRef } from 'react';

interface SliderWithIndicatorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

const SliderWithIndicator: React.FC<SliderWithIndicatorProps> = ({
  value,
  onChange,
  min = 1,
  max = 64,
  label,
  className = "w-48"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const sliderRef = useRef<HTMLInputElement>(null);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
    
    // Calculate position for the tooltip
    const slider = sliderRef.current;
    if (slider) {
      const rect = slider.getBoundingClientRect();
      const percentage = (newValue - min) / (max - min);
      const position = rect.width * percentage;
      setSliderPosition(position);
    }
  };

  return (
    <div className="relative">
      {label && (
        <p className="mb-2 text-sm font-medium text-zinc-100">{label}</p>
      )}
      <div className="relative">
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className={`${className} accent-black-600`}
        />
        {isDragging && (
          <div 
            className="
              absolute top-6
              transform -translate-x-1/2
              bg-black-600/90 backdrop-blur-sm
              text-white
              text-xs font-medium
              transition-all duration-150
              px-2 py-1
              rounded
              shadow-lg
              after:content-[''] after:absolute after:left-1/2 after:-top-1.5 after:-translate-x-1/2
              after:border-4 after:border-transparent after:border-b-black-600/90
            "
            style={{ left: `${sliderPosition}px` }}
          >
            {value}
          </div>
        )}
      </div>
    </div>
  );
};

export default SliderWithIndicator;