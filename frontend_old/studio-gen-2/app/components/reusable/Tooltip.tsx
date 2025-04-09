import React, { useState, useRef } from "react";
import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
  className?: string;
}

export const Tooltip = ({
  children,
  content,
  position,
  className,
}: TooltipProps) => {
  const [isShowing, setIsShowing] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getStyleForPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      switch (position) {
        case "top":
          return {
            bottom: rect.height + 10,
            left: "50%",
            transform: "translateX(-50%)",
          };
        case "bottom":
          return {
            top: rect.height + 10,
            left: "50%",
            transform: "translateX(-50%)",
          };
        case "left":
          return {
            right: rect.width + 10,
            top: "50%",
            transform: "translateY(-50%)",
          };
        case "right":
          return {
            left: rect.width + 10,
            top: "50%",
            transform: "translateY(-50%)",
          };
        default:
          return {};
      }
    }
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsShowing(true)}
      onMouseLeave={() => setIsShowing(false)}
      className="relative"
    >
      {children}
      <Transition
        show={isShowing}
        enter="transition ease-out duration-200 delay-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          ref={tooltipRef}
          style={getStyleForPosition()}
          className={twMerge(
            "pointer-events-none absolute z-10 w-max rounded-lg bg-ui-controls px-2.5 py-1.5 text-sm font-medium text-white shadow-xl",
            className ? className : "",
          )}
        >
          {content}
        </div>
      </Transition>
    </div>
  );
};
