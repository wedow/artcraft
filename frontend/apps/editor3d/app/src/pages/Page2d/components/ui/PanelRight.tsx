import { HTMLAttributes, useState } from "react";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import { Transition } from "@headlessui/react";

export const PanelRight = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const [isOpen, setIsOpen] = useState(true);
  const gridClasses = twMerge(
    "col-span-3 col-start-10",
    "row-span-12 row-start-1",
  );
  const buttonClasses =
    "w-6 bg-ui-panel border-ui-border border-l border-t border-b rounded-l-md py-4";
  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
          }}
          className={twMerge(buttonClasses, "fixed right-0 top-1")}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}
      <Transition show={isOpen}>
        <div
          className={twMerge(
            gridClasses,
            // base styles
            "relative border border-ui-border bg-ui-panel p-2 transition ease-in-out",
            // Shared closed styles
            "data-[closed]:opacity-0",
            // Entering styles
            "data-[enter]:data-[closed]:translate-x-full data-[enter]:duration-100",
            // Leaving styles
            "data-[leave]:data-[closed]:translate-x-full data-[leave]:duration-300",

            //extra overriderclassnames
            className,
          )}
          {...props}
        >
          {children}

          <button
            onClick={() => {
              setIsOpen(false);
            }}
            className={twMerge(buttonClasses, "absolute -left-6 top-1")}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </Transition>
    </>
  );
};
