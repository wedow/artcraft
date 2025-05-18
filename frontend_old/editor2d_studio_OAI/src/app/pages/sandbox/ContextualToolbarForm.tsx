import { useState } from "react";

import { Input, Button } from "~/components/ui";
import { uiAccess } from "~/signals";
import { uiEvents } from "~/signals";

import { ToolbarNodeButtonData } from "~/components/features/ToolbarNode/data";
import { ToolbarNodeButtonNames } from "~/components/features/ToolbarNode/enums";

export const ContextualToolbarForm = () => {
  const toolbarImage = uiAccess.toolbarNode;

  const {
    isShowing,
    disabled: allDisabled,
    buttonStates,
  } = toolbarImage.signal.value;

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold">Image Toolbar Props</label>
      <p className="-mt-2 pb-1">
        toolbar setup is assumed, in real implementation you may want to start
        with the setup function instead
      </p>
      <div className="flex items-center gap-2">
        <label>X:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="X"
          value={x}
          onChange={(e) => {
            setX(parseInt(e.target.value) || 0);
          }}
        />
        <label>Y:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="Y"
          value={y}
          onChange={(e) => {
            setY(parseInt(e.target.value) || 0);
          }}
        />
        <Button
          onClick={() =>
            toolbarImage.setPosition({
              x: x,
              y: y,
            })
          }
        >
          Set Position
        </Button>
        <Button disabled={isShowing} onClick={() => toolbarImage.show()}>
          Show
        </Button>

        <Button disabled={!isShowing} onClick={() => toolbarImage.hide()}>
          Hide
        </Button>
        <Button
          onClick={() => {
            const exec = allDisabled
              ? toolbarImage.enable
              : toolbarImage.disable;
            exec();
          }}
        >
          {allDisabled ? "Enable" : "Disable"}
        </Button>
      </div>
      <div className="grid max-w-2xl grid-cols-6 gap-2">
        {Object.values(ToolbarNodeButtonData).map((button) => (
          <Button
            key={button.name}
            icon={button.icon}
            variant={
              buttonStates[button.name].disabled ? "secondary" : "primary"
            }
            onClick={() =>
              toolbarImage.changeButtonState(button.name, {
                disabled: !buttonStates[button.name].disabled,
              })
            }
          >
            <span className="w-12">
              {buttonStates[button.name].disabled ? "Enable" : "Disable"}
            </span>
          </Button>
        ))}
        {Object.values(ToolbarNodeButtonData).map((button) => (
          <Button
            key={button.name}
            icon={button.icon}
            variant={buttonStates[button.name].active ? "primary" : "secondary"}
            onClick={() =>
              toolbarImage.changeButtonState(button.name, {
                active: !buttonStates[button.name].active,
              })
            }
          >
            <span className="w-12">
              {buttonStates[button.name].active ? "Unactive" : "Active"}
            </span>
          </Button>
        ))}
      </div>
      <LittleThing />
    </div>
  );
};

export const LittleThing = () => {
  Object.values(ToolbarNodeButtonNames).forEach((buttonName) => {
    uiEvents.toolbarNode[buttonName].onClick(() => {
      console.log(buttonName);
      uiAccess.toolbarNode.changeButtonState(buttonName, {
        disabled: true,
      });
    });
  });

  return (
    <div>
      <p>See Log for Button Click Events</p>
      <p className="text-xs">
        Wil: I fucked up the rerender on this page but the test on the engine
        wont fire multiple times, so no need to worry for now.
      </p>
    </div>
  );
};
