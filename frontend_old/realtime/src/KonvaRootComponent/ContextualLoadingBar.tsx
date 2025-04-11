import { twMerge } from "tailwind-merge";
import { Transition } from "@headlessui/react";
import { LoadingBar } from "~/components/ui";
import { dispatchUiEvents, uiAccess } from "~/signals";
import { transitionTimingStyles } from "~/components/styles";

export const ContextualLoadingBar = () => {
  const { isShowing, position, width, ...rest } =
    uiAccess.loadingBar.signal.value;

  return (
    <Transition
      as="div"
      show={isShowing}
      className={twMerge(
        transitionTimingStyles,
        "fixed -translate-x-1/2 translate-y-24 data-[closed]:opacity-0",
      )}
      style={{
        top: position.y,
        left: position.x,
        width: width ? `${width}px` : undefined,
      }}
    >
      <LoadingBar
        {...rest}
        onRetry={(e) => {
          // console.log("CONTEXTUAL LOADING BAR DISPATCH");
          dispatchUiEvents.toolbarNode.retry(e);
        }}
      />
    </Transition>
  );
};
