import { useCallback } from "react";

import { uiAccess, uiEvents, dispatchUiEvents } from "~/signals";
import { Button } from "~/components/ui";

uiEvents.buttonTest.onClick(() => {
  console.log("uiEvents.buttonTest.onClick calls uiAccess.buttonTest.disable");
  uiAccess.buttonTest.disable();
});

export const ButtonTestTester = () => {
  const handleClick = useCallback(() => {
    dispatchUiEvents.buttonTest.onClick();
  }, []);

  return (
    <div className="flex items-center gap-4">
      <label>Button Test Tester</label>
      <Button
        onClick={handleClick}
        disabled={uiAccess.buttonTest.signal.value.disabled}
      >
        Click me to disable
      </Button>
      <Button onClick={() => uiAccess.buttonTest.enable()}>Enable</Button>
    </div>
  );
};
