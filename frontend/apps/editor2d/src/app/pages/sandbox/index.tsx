import { ContextualToolbarNode } from "~/KonvaRootComponent/ContextualToolbarNode";
import { ContextualLoadingBar } from "~/KonvaRootComponent/ContextualLoadingBar";
import { ContextualButtonRetry } from "~/KonvaRootComponent/ContextualButtonRetry";

import { useRenderCounter } from "~/hooks/useRenderCounter";

import { ContextualToolbarForm } from "./ContextualToolbarForm";
import { ContextualLoadingBarForm } from "./ContextualLoadingBarForm";
import { ContextualButtonRetryForm } from "./ContextualButtonRetryForm";
import { DialogErrorForm } from "./DialogErrorForm";

import { ButtonTestTester } from "./ButtonTestTester";

export const Sandbox = () => {
  useRenderCounter("Sandbox");

  return (
    <div className="p-2">
      <div className="flex flex-col gap-8">
        <h1>Sandbox</h1>
        <ButtonTestTester />
        <ContextualToolbarForm />
        <ContextualLoadingBarForm />
        <ContextualButtonRetryForm />
        <DialogErrorForm />
      </div>

      <ContextualToolbarNode />
      {/* <ContextualLoadingBar /> */}
      <ContextualButtonRetry />
    </div>
  );
};
