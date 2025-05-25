import { useSignals } from "@preact/signals-react/runtime";
import { faTriangleExclamation } from "@fortawesome/pro-solid-svg-icons";

import { TransitionDialogue } from "~/components";
import { Button } from "@storyteller/ui-button"
import {
  showErrorDialog,
  errorDialogMessage,
  errorDialogTitle,
} from "~/pages/PageEnigma/signals";

export function ErrorDialog() {
  useSignals();

  return (
    <TransitionDialogue
      title={errorDialogTitle.value}
      titleIcon={faTriangleExclamation}
      titleIconClassName="text-brand-primary"
      isOpen={showErrorDialog.value}
      onClose={() => (showErrorDialog.value = false)}
      showClose={false}
    >
      <div>
        {errorDialogMessage.value}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => (showErrorDialog.value = false)}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </TransitionDialogue>
  );
}
