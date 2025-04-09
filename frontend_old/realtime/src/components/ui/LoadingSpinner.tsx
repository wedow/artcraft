import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Spinner } from "./Spinner";

export const LoadingSpinner = ({
  isShowing,
  message,
}: {
  isShowing: boolean;
  message?: string;
}) => {
  return (
    <Transition show={isShowing}>
      <div
        className={twMerge(
          // default styles
          "flex flex-col items-center gap-2",
          // base transition properties
          "transition-opacity ease-in-out",
          // Shared closed styles
          "data-[closed]:opacity-0",
          // Entering styles
          "data-[enter]:duration-100",
          // Leaving styles
          "data-[leave]:duration-300",
        )}
      >
        <Spinner className="size-10" />
        {message && <label>{message}</label>}
      </div>
    </Transition>
  );
};
