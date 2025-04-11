import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { faRotateRight } from "@fortawesome/pro-solid-svg-icons";

import { Button } from "~/components/ui";
import { uiAccess } from "~/signals/uiAccess";
import { dispatchUiEvents } from "~/signals";
import { transitionTimingStyles } from "~/components/styles";

export const ContextualButtonRetry = () => {
  const { isShowing, position, ...rest } = uiAccess.buttonRetry.signal.value;
  const handleOnClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    dispatchUiEvents.buttonRetry.onClick(e);
  };
  return (
    <Transition show={isShowing}>
      <div
        className={twMerge(
          transitionTimingStyles,
          "fixed data-[closed]:opacity-0",
        )}
        style={{
          top: position.y,
          left: position.x,
        }}
      >
        <Button icon={faRotateRight} onClick={handleOnClick} {...rest}>
          Retry
        </Button>
      </div>
    </Transition>
  );
};
