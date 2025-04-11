import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import { faVolumeHigh, faChevronRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { H4, H6, Button, Label, Textarea } from "~/components";

import { TtsState } from "~/pages/PageEnigma/models/voice";
import { AudioTabPages } from "~/pages/PageEnigma/enums";
import { ToastTypes } from "~/enums";
import { addToast, startPollingActiveJobs } from "~/signals";
import { TtsApi } from "~/Classes/ApiManager/TtsApi";

export const PageTTS = ({
  changePage,
  ttsState,
  setTtsState,
}: {
  changePage: (newPage: AudioTabPages) => void;
  ttsState: TtsState;
  setTtsState: (newState: TtsState) => void;
}) => {
  const requestTts = useCallback(async () => {
    const modelToken = ttsState.voice ? ttsState.voice.weight_token : undefined;

    if (!modelToken) {
      addToast(ToastTypes.ERROR, "Please first pick a voice");
      return;
    }

    const request = {
      uuid_idempotency_token: uuidv4(),
      tts_model_token: modelToken,
      inference_text: ttsState.text,
    };

    const ttsApi = new TtsApi();
    const response = await ttsApi.GenerateTtsAudio(request);
    if (
      response.success &&
      response.data &&
      response.data.inference_job_token
    ) {
      startPollingActiveJobs();
      changePage(AudioTabPages.LIBRARY);
    } else if (response.errorMessage) {
      addToast(ToastTypes.ERROR, response.errorMessage);
    } else {
      addToast(ToastTypes.ERROR, "Unknown Error: Generate TTS");
    }
  }, [ttsState, changePage]);

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTtsState({
      ...ttsState,
      text: e.target.value,
    });
  };

  return (
    <>
      <Label>Select a Voice</Label>
      <button
        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-brand-secondary p-3 text-start transition-all hover:bg-ui-controls-button/40"
        onClick={() => changePage(AudioTabPages.SELECT_TTS_MODEL)}
      >
        <span className="h-12 w-12 rounded-lg bg-white/10" />
        <div className="grow">
          {!ttsState.voice && <H4>None Selected</H4>}
          {ttsState.voice && (
            <>
              <H4>{ttsState.voice.title}</H4>
              <H6 className="text-white/70">
                by {ttsState.voice.creator.display_name}
              </H6>
            </>
          )}
        </div>
        <FontAwesomeIcon icon={faChevronRight} className="text-xl opacity-60" />
      </button>

      <div className="mt-4 w-full">
        <Textarea
          label="What would you like to say?"
          placeholder="Enter what you want the voice to say here."
          value={ttsState.text}
          onChange={handleTextInput}
          rows={8}
        />
      </div>

      <Button
        className="mt-4 h-11 w-full text-sm"
        variant="primary"
        disabled={ttsState.text === ""}
        icon={faVolumeHigh}
        onClick={requestTts}
      >
        Generate
      </Button>
    </>
  );
};
