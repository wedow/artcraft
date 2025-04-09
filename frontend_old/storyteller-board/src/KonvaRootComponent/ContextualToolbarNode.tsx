import { MouseEventHandler, useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

import { uiAccess } from "~/signals/uiAccess";
import { dispatchUiEvents } from "~/signals/uiEvents";

import { ToolbarNode } from "~/components/features/ToolbarNode";
import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode/enums";
import { transitionTimingStyles } from "~/components/styles";

export const ContextualToolbarNode = () => {
  const [winSize, setWinSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { isShowing, position, ...rest } = uiAccess.toolbarNode.signal.value;
  const buttonsProps = Object.values(ToolbarNodeButtonNames).reduce(
    (acc, buttonName) => {
      acc[buttonName] = {
        onClick: dispatchUiEvents.toolbarNode[buttonName],
        disabled:
          uiAccess.toolbarNode.signal.value.buttonStates[buttonName].disabled,
        hidden:
          uiAccess.toolbarNode.signal.value.buttonStates[buttonName].hidden,
        active:
          uiAccess.toolbarNode.signal.value.buttonStates[buttonName].active,
      };
      return acc;
    },
    {} as {
      [key in ToolbarNodeButtonNames]: {
        onClick: MouseEventHandler<HTMLButtonElement>;
        disabled: boolean;
        hidden: boolean;
        active: boolean;
      };
    },
  );
  useEffect(() => {
    function resizeHandler() {
      setWinSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  const boundedTopPosition = Math.min(position.y, winSize.height - 164);
  return (
    <Transition
      as="div"
      show={isShowing}
      className={twMerge(
        transitionTimingStyles,
        "fixed -translate-x-1/2 translate-y-5 data-[closed]:opacity-0",
      )}
      style={{
        top: boundedTopPosition,
        left: position.x,
      }}
    >
      <ToolbarNode
        {...rest}
        buttonsProps={buttonsProps}
        locked={uiAccess.toolbarNode.signal.value.locked}
        onLockClicked={(e) => {
          dispatchUiEvents.toolbarNode.lock(e);
        }}
      />
    </Transition>
  );
};
