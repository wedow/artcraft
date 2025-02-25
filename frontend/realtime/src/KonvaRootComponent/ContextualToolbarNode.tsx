import { MouseEventHandler, useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

import { uiAccess } from "~/signals/uiAccess";
import { dispatchUiEvents } from "~/signals/uiEvents";

import { ToolbarNode } from "~/components/features/ToolbarNode";
import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode/enums";
import { transitionTimingStyles } from "~/components/styles";
import { useSignals } from "@preact/signals-react/runtime";

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

  const handleColorChange = (color: string) => {
    // Don't do anything if no node is known to be bound
    if (uiAccess.toolbarNode.signal.value.knodeIds.length < 1) {
      return;
    }

    // Update the UI component
    uiAccess.toolbarNode.setColor(color);

    // Signal the engine with the node ID (just grab the first -and expected only- node)
    const nodeID = uiAccess.toolbarNode.signal.value.knodeIds[0];
    dispatchUiEvents.toolbarNode.setSelectedColor({ kNodeId: nodeID, color });
  }

  useSignals();
  const color = uiAccess.toolbarNode.signal.value.color;

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
        color={color}
        onColorChange={handleColorChange}
      />
    </Transition>
  );
};
