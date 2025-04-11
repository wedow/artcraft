import { useState } from "react";
import { uiAccess } from "~/signals/uiAccess";
import { uiEvents } from "~/signals/uiEvents";

import { Input, Button } from "~/components/ui";

export const ContextualButtonRetryForm = () => {
  uiEvents.buttonRetry.onClick(() => {
    console.log(
      "uiEvents.buttonRetry.onClick calls uiAccess.buttonRetry.disable",
    );
    uiAccess.buttonRetry.disable();
  });
  const buttonRetry = uiAccess.buttonRetry;

  const [state, setState] = useState({
    position: {
      x: 0,
      y: 0,
    },
    isShowing: false,
    disabled: false,
  });

  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold">Retry Button Props</label>
      <div className="flex items-center gap-2">
        <label>X:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="X"
          value={state.position.x}
          onChange={(e) => {
            setState((curr) => ({
              ...curr,
              position: {
                ...curr.position,
                x: parseInt(e.target.value) || 0,
              },
            }));
          }}
        />
        <label>Y:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="Y"
          value={state.position.y}
          onChange={(e) => {
            setState((curr) => ({
              ...curr,
              position: {
                ...curr.position,
                y: parseInt(e.target.value) || 0,
              },
            }));
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => buttonRetry.show(state)}>Show</Button>
        <Button onClick={() => buttonRetry.updatePosition(state.position)}>
          Update
        </Button>
        <Button onClick={() => buttonRetry.hide()}>Hide</Button>
        <Button onClick={() => buttonRetry.enable()}>Enable</Button>
      </div>
    </div>
  );
};
