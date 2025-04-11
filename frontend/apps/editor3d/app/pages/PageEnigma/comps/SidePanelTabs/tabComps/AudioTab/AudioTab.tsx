import { useCallback, useEffect, useState } from "react";
import { useSignals } from "@preact/signals-react/runtime";

import { AudioTabPages } from "~/pages/PageEnigma/enums";
import { AudioPanelState } from "~/pages/PageEnigma/models/voice";

import { Weight } from "~/models";
import { initialTtsState, initialV2VState } from "./values";

import { PageAudioLibrary } from "./pageAudioLibrary";
import { PageAudioGeneration } from "./pageAudioGeneration";
import { PageSelectTtsModel } from "./pageSelectTtsModel";
import { PageSelectV2VModel } from "./pageSelectV2VModel";
import { PollUserAudioItems } from "~/hooks/useBackgroundLoadingMedia/utilities";
import {
  ScopedWeightCategory,
  WeightsApi,
} from "~/Classes/ApiManager/WeightsApi";
import { addToast } from "~/signals";
import { ToastTypes } from "~/enums";

export const AudioTab = () => {
  useSignals();

  // local states and data
  const [state, setState] = useState<AudioPanelState>({
    firstLoad: false,
    page: AudioTabPages.LIBRARY,
    // children states are managed at top level for persistent memories
    lastWorkingAudioGeneration: AudioTabPages.TTS,
    ttsState: initialTtsState,
    v2vState: initialV2VState,
  });

  const [ttsModels, setTtsModels] = useState<Weight[]>([]);
  const [v2vModels, setV2VModels] = useState<Weight[]>([]);

  const ListTtsModels = useCallback(async () => {
    const weightApi = new WeightsApi();
    const response = await weightApi.ListWeights({
      weightCategory: [ScopedWeightCategory.TEXT_TO_SPEECH],
      pageSize: 10000,
    });
    if (response.success && response.data) {
      setTtsModels(response.data);
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Getting TTS Models",
    );
  }, []);

  const ListVoiceConversionModels = useCallback(async () => {
    const weightApi = new WeightsApi();
    const response = await weightApi.ListWeights({
      weightCategory: [ScopedWeightCategory.VOICE_CONVERSION],
      pageSize: 10000,
    });
    if (response.success && response.data) {
      setV2VModels(response.data);
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Getting V2V Models",
    );
  }, []);

  useEffect(() => {
    if (!state.firstLoad) {
      //fetch all the data on first load once, after securing auth info
      ListTtsModels();
      ListVoiceConversionModels();
      setState((curr) => ({ ...curr, firstLoad: true }));
      // completed the first load
    }
  }, [state, ListTtsModels, ListVoiceConversionModels]);

  const changePage = useCallback((newPage: AudioTabPages) => {
    setState((curr) => ({
      ...curr,
      page: newPage,
    }));
  }, []);

  switch (state.page) {
    case AudioTabPages.LIBRARY: {
      return (
        <PageAudioLibrary
          changePage={changePage}
          reloadLibrary={PollUserAudioItems}
        />
      );
    }
    case AudioTabPages.SELECT_TTS_MODEL: {
      return (
        <PageSelectTtsModel
          changePage={changePage}
          ttsModels={ttsModels}
          onSelect={(selectedVoice) => {
            setState((curr) => ({
              ...curr,
              ttsState: { ...curr.ttsState, voice: selectedVoice },
              page: AudioTabPages.GENERATE_AUDIO,
            }));
          }}
        />
      );
    }
    case AudioTabPages.SELECT_V2V_MODEL: {
      return (
        <PageSelectV2VModel
          changePage={changePage}
          v2vModels={v2vModels}
          onSelect={(selectedVoice) => {
            setState((curr) => ({
              ...curr,
              v2vState: { ...curr.v2vState, voice: selectedVoice },
              page: AudioTabPages.GENERATE_AUDIO,
            }));
          }}
        />
      );
    }
    case AudioTabPages.GENERATE_AUDIO: {
      return (
        <PageAudioGeneration
          changePage={changePage}
          audioPanelState={state}
          setAudioPanelState={setState}
        />
      );
    }
    default:
      return <p>Unknown Page Error</p>;
  }
};
