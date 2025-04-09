import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useRef } from "react";

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  data: { label: string; value: string; icon?: IconDefinition }[];
}

export const SegmentedControl = ({
  value,
  onChange,
  data,
}: SegmentedControlProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (newValue: string) => {
    onChange(newValue);
  };

  const currentIndex = data.findIndex((item) => item.value === value);
  const highlightStyle: React.CSSProperties = {
    width: `${100 / data.length}%`,
    transform: `translateX(${currentIndex * 100}%)`,
    transition: "transform 0.2s ease",
  };

  return (
    <div className="rounded-md bg-brand-secondary p-1">
      <div
        className="relative flex rounded-sm bg-brand-secondary/50"
        ref={containerRef}
      >
        <div
          className="absolute bottom-0 left-0 top-0 rounded-md bg-brand-secondary-700"
          style={highlightStyle}
        />
        {data.map((item) => (
          <button
            key={item.value}
            onClick={() => handleClick(item.value)}
            className={`relative z-10 flex-1 px-3 py-1.5 text-sm font-medium transition-all ${
              value === item.value
                ? "text-white"
                : "text-brand-secondary-400 hover:text-brand-secondary-300"
            }`}
          >
            {item.icon && (
              <FontAwesomeIcon
                className="me-1.5 text-xs"
                icon={item.icon as IconDefinition}
              />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
