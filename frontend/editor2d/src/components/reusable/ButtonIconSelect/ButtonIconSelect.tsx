import { useState } from "react";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";

interface Option {
  value: string;
  icon: IconDefinition;
  text?: string;
}

interface ButtonIconSelectProps {
  options: Option[];
  onOptionChange?: (value: string) => void;
}

export function ButtonIconSelect({
  options,
  onOptionChange,
}: ButtonIconSelectProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    options[0].value,
  );

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    if (onOptionChange) {
      onOptionChange(value);
    }
  };

  return (
    <div className="flex space-x-1">
      {options.map(({ value, icon, text }) => (
        <button
          key={value}
          className={twMerge(
            `flex h-8 items-center justify-center rounded-lg border text-sm transition-all duration-150`,
            text ? "h-auto w-auto gap-2 px-2.5 py-1" : "w-8",
            selectedOption === value
              ? "border-brand-primary bg-ui-panel/[0.3]"
              : "border-transparent hover:bg-ui-panel/[0.4]",
          )}
          onClick={() => handleOptionChange(value)}
        >
          <FontAwesomeIcon icon={icon} />
          {text && (
            <span className="text-nowrap text-sm font-medium">{text}</span>
          )}
        </button>
      ))}
    </div>
  );
}
