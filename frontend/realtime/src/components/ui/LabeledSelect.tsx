import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Button } from "~/components/ui/Button";
import { useState, useRef } from "react";

export interface LabeledSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

// TODO: finish up this hover drop down component (WIP) - BFlat

export const LabeledSelect = ({
  label,
  value,
  onChange,
  options = ["1", "2", "3", "4"],
}: LabeledSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<number>();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  return (
    <Popover className="relative">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <PopoverButton as={Button} variant="secondary" className="px-3 py-1.5">
          {label} — {value}
        </PopoverButton>
        {isOpen && (
          <PopoverPanel
            static
            className="absolute z-10 mt-1 w-fit origin-top-left rounded-md border bg-white p-1 shadow-lg transition-all duration-200 ease-out"
            style={{
              opacity: isOpen ? 1 : 0,
              transform: `scale(${isOpen ? 1 : 0.95}) translateY(${isOpen ? 0 : -4}px)`,
            }}
          >
            <div className="flex flex-col gap-1">
              {options.map((option) => (
                <Button
                  key={option}
                  className="justify-start px-3 py-1.5"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          </PopoverPanel>
        )}
      </div>
    </Popover>
  );
};
