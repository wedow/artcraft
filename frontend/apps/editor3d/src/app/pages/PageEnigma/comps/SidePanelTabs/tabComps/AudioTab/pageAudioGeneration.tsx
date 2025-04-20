import { twMerge } from "tailwind-merge";
import {
  AudioPanelState,
  TtsState,
  V2VState,
} from "~/pages/PageEnigma/models/voice";

import { TabTitle } from "~/pages/PageEnigma/comps/SidePanelTabs/sharedComps/TabTitle";
import { PageTTS } from "./pageTTS";
import { PageVoicetoVoice } from "./pageVoiceToVoice";
import { AudioTabPages } from "~/pages/PageEnigma/enums";

export const PageAudioGeneration = ({
  changePage,
  audioPanelState,
  setAudioPanelState,
}: {
  changePage: (newPage: AudioTabPages) => void;
  audioPanelState: AudioPanelState;
  setAudioPanelState: React.Dispatch<React.SetStateAction<AudioPanelState>>;
}) => {
  const subpage = audioPanelState.lastWorkingAudioGeneration;
  const changeSubpage = (newSubpage: AudioTabPages.TTS | AudioTabPages.V2V) => {
    setAudioPanelState((curr) => ({
      ...curr,
      lastWorkingAudioGeneration: newSubpage,
    }));
  };
  const setTtsState = (newTtsState: TtsState) => {
    setAudioPanelState((curr) => ({
      ...curr,
      ttsState: { ...curr.ttsState, ...newTtsState },
    }));
  };
  const setV2VState = (newV2VState: V2VState) => {
    setAudioPanelState((curr) => ({
      ...curr,
      v2vState: { ...curr.v2vState, ...newV2VState },
    }));
  };
  return (
    <>
      <TabTitle
        title="Generate Audio"
        onBack={() => changePage(AudioTabPages.LIBRARY)}
      />
      <div className="flex flex-col px-4">
        <div className="mb-4 flex h-10 w-full justify-evenly overflow-hidden rounded-lg">
          <button
            className={twMerge(
              "grow cursor-pointer bg-brand-secondary p-2 text-sm font-medium transition-all",
              subpage === AudioTabPages.TTS
                ? "bg-ui-controls-button"
                : "hover:bg-ui-controls-button/50",
            )}
            disabled={subpage === AudioTabPages.TTS}
            onClick={() => changeSubpage(AudioTabPages.TTS)}
          >
            Text to Speech
          </button>
          <button
            className={twMerge(
              "grow cursor-pointer bg-brand-secondary p-2 text-sm font-medium transition-all",
              subpage === AudioTabPages.V2V
                ? "bg-ui-controls-button"
                : "hover:bg-ui-controls-button/50",
            )}
            disabled={subpage === AudioTabPages.V2V}
            onClick={() => {
              changeSubpage(AudioTabPages.V2V);
            }}
          >
            Voice to Voice
          </button>
        </div>

        {subpage === AudioTabPages.TTS && (
          <PageTTS
            changePage={changePage}
            ttsState={audioPanelState.ttsState}
            setTtsState={setTtsState}
          />
        )}
        {subpage === AudioTabPages.V2V && (
          <PageVoicetoVoice
            changePage={changePage}
            v2vState={audioPanelState.v2vState}
            setV2VState={setV2VState}
          />
        )}
      </div>
    </>
  );
};
