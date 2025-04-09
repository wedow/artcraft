import { ChangeEvent, useLayoutEffect, useState } from "react";
import { Button, Textarea, TransitionDialogue } from "~/components";
import {
  addPromptTravel,
  updatePromptTravel,
} from "~/pages/PageEnigma/signals/promptTravelGroup";
import { useSignals } from "@preact/signals-react/runtime";
import { Clip } from "~/pages/PageEnigma/models";

interface Props {
  clip?: Clip;
  openPrompt: boolean;
  setOpenPrompt: (open: boolean) => void;
  offset: number;
}

export const AddEditPrompt = ({
  clip,
  openPrompt,
  setOpenPrompt,
  offset,
}: Props) => {
  useSignals();
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");

  useLayoutEffect(() => {
    if (clip) {
      setPrompt(clip.name);
    }
  }, [clip]);

  const onChangeHandlerPositive = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const onSave = () => {
    if (!prompt) {
      setError("Enter a prompt before saving");
      return;
    }
    setOpenPrompt(false);
    if (!clip) {
      addPromptTravel({
        text: prompt,
        length: 60,
        offset: offset,
      });
      return;
    }
    updatePromptTravel({
      id: clip.clip_uuid,
      offset: clip.offset,
      length: clip.length,
      name: prompt,
    });
  };

  return (
    <TransitionDialogue
      isOpen={openPrompt}
      onClose={() => setOpenPrompt(false)}
      title="Add Text Prompt"
    >
      <div>
        <Textarea
          label="Enter a Prompt"
          className="w-full"
          rows={3}
          name="positive-prompt"
          placeholder="Type here to describe your scene"
          onChange={onChangeHandlerPositive}
          required
          value={prompt}
        />
        {!!error && (
          <div className="mt-2 text-sm text-brand-primary">{error}</div>
        )}
        <div className="mt-4 flex justify-end">
          <div className="flex gap-2">
            <Button variant="action" onClick={() => setOpenPrompt(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </TransitionDialogue>
  );
};
