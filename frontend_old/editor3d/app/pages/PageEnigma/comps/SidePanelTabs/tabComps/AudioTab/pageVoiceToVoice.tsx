import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { faChevronRight, faRightLeft } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ToastTypes } from "~/enums";
import { AudioTabPages } from "~/pages/PageEnigma/enums";
import { V2VState } from "~/pages/PageEnigma/models/voice";
import { VoiceConversionApi } from "~/Classes/ApiManager/VoiceConversionApi";
import { addToast, startPollingActiveJobs } from "~/signals";
import { H4, H6, Button, Label, UploadAudioComponent } from "~/components";

export const PageVoicetoVoice = ({
  changePage,
  v2vState,
  setV2VState,
}: {
  changePage: (newPage: AudioTabPages) => void;
  v2vState: V2VState;
  setV2VState: (newState: V2VState) => void;
}) => {
  const requestV2V = useCallback(async () => {
    const modelToken = v2vState.voice ? v2vState.voice.weight_token : undefined;
    if (!modelToken) {
      addToast(ToastTypes.ERROR, "Please first pick a voice");
      return;
    }
    if (!v2vState.inputFileToken) {
      addToast(ToastTypes.ERROR, "Please upload a voice clip to convert from");
      return;
    }
    const request = {
      uuidIdempotencyToken: uuidv4(),
      voiceConversionModelToken: modelToken,
      sourceMediaUploadToken: v2vState.inputFileToken,
    };
    const v2vApi = new VoiceConversionApi();
    const response = await v2vApi.ConvertVoice(request);
    if (response.success && response.data) {
      startPollingActiveJobs();
      changePage(AudioTabPages.LIBRARY);
      return;
    }
    addToast(
      ToastTypes.ERROR,
      response.errorMessage || "Unknown Error in Generating Voice Conversions",
    );
  }, [v2vState, changePage]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col">
        <Label>Select a Voice</Label>
        <button
          className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-brand-secondary p-3 text-start transition-all hover:bg-ui-controls-button/40"
          onClick={() => changePage(AudioTabPages.SELECT_V2V_MODEL)}
        >
          <span className="h-12 w-12 rounded-lg bg-white/10" />
          <div className="grow">
            {!v2vState.voice && <H4>None Selected</H4>}
            {v2vState.voice && (
              <>
                <H4>{v2vState.voice.title}</H4>
                <H6 className="text-white/70">
                  by {v2vState.voice.creator.display_name}
                </H6>
              </>
            )}
          </div>
          <FontAwesomeIcon
            icon={faChevronRight}
            className="text-xl opacity-60"
          />
        </button>
      </div>

      <div className="flex flex-col">
        <Label>Upload Audio</Label>
        <UploadAudioComponent
          file={v2vState.file}
          onFileStaged={(file: File) => {
            setV2VState({ ...v2vState, file: file });
          }}
          onClear={() => {
            setV2VState({ ...v2vState, file: undefined });
          }}
          onFileUploaded={(fileToken: string) => {
            setV2VState({
              ...v2vState,
              inputFileToken: fileToken,
            });
          }}
        />
      </div>
      <Button
        className="w-full py-3 text-sm"
        variant="primary"
        disabled={!v2vState.voice || !v2vState.inputFileToken}
        icon={faRightLeft}
        onClick={requestV2V}
      >
        Convert
      </Button>
    </div>
  );
};
