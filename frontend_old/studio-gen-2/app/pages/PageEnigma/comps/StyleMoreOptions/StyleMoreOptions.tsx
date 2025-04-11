import { useSignals } from "@preact/signals-react/runtime";
import { Button, TransitionDialogue } from "~/components";
import { StyleOptions } from "~/pages/PageEnigma/comps/SidePanelTabs/tabComps/StylizeTab/StyleOptions";

interface Props {
  onClose: () => void;
}
export const StyleMoreOptions = ({ onClose }: Props) => {
  useSignals();

  return (
    <TransitionDialogue isOpen={true} onClose={onClose} title="More Options">
      <StyleOptions />
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose} variant="action">
          Close
        </Button>
      </div>
    </TransitionDialogue>
  );
};
