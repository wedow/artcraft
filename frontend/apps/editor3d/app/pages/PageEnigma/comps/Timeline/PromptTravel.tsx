import { fullWidth } from "~/pages/PageEnigma/signals";
import { useSignals } from "@preact/signals-react/runtime";
import {
  promptTravelGroup,
  updatePromptTravel,
} from "~/pages/PageEnigma/signals/promptTravelGroup";
import { TrackClipsPrompt } from "~/pages/PageEnigma/comps/Timeline/TrackClipsPrompt";

export const PromptTravel = () => {
  useSignals();
  const { clips } = promptTravelGroup.value;

  return (
    <div
      id="track-prompt-travel"
      className="bg-prompt-groupBg relative block rounded-r-lg pb-2 pr-4"
      style={{ width: fullWidth.value + 16 }}
    >
      <div className="pt-[30px]">
        <TrackClipsPrompt
          id={promptTravelGroup.value.id}
          clips={clips}
          updateClip={updatePromptTravel}
        />
      </div>
    </div>
  );
};
