import { create } from "zustand";
import { Weight } from "@storyteller/components/src/api/weights/GetWeight";
import { EnqueueVoiceConversionFrequencyMethod } from "@storyteller/components/src/api/voice_conversion/EnqueueVoiceConversion"; // Make sure to import this

interface VcStoreState {
  selectedVoice: Weight | undefined;
  setSelectedVoice: (voice: Weight | undefined) => void;
  semitones: number;
  setSemitones: (value: number) => void;
  autoConvertF0: boolean;
  setAutoConvertF0: (value: boolean) => void;
  maybeF0MethodOverride: EnqueueVoiceConversionFrequencyMethod;
  setMaybeF0MethodOverride: (
    method: EnqueueVoiceConversionFrequencyMethod
  ) => void;
  mediaUploadToken: string | undefined;
  setMediaUploadToken: (token: string | undefined) => void;
  hasUploadedFile: boolean;
  setHasUploadedFile: (value: boolean) => void;
  hasRecordedFile: boolean;
  setHasRecordedFile: (value: boolean) => void;
  recordingBlobStore: Blob | undefined;
  setRecordingBlobStore: (blob: Blob | undefined) => void;
  isUploadDisabled: boolean;
  setIsUploadDisabled: (value: boolean) => void;
  file: any;
  setFile: (file: any) => void;
  audioLink: string | undefined;
  setAudioLink: (link: string | undefined) => void;
  formIsCleared: boolean;
  setFormIsCleared: (cleared: boolean) => void;
}

const useVcStore = create<VcStoreState>(set => ({
  selectedVoice: undefined,
  setSelectedVoice: voice => set({ selectedVoice: voice }),
  semitones: 0,
  setSemitones: value => set({ semitones: value }),
  autoConvertF0: false,
  setAutoConvertF0: value => set({ autoConvertF0: value }),
  maybeF0MethodOverride: EnqueueVoiceConversionFrequencyMethod.Rmvpe,
  setMaybeF0MethodOverride: method => set({ maybeF0MethodOverride: method }),
  mediaUploadToken: undefined,
  setMediaUploadToken: token => set({ mediaUploadToken: token }),
  hasUploadedFile: false,
  setHasUploadedFile: value => set({ hasUploadedFile: value }),
  hasRecordedFile: false,
  setHasRecordedFile: value => set({ hasRecordedFile: value }),
  recordingBlobStore: undefined,
  setRecordingBlobStore: blob => set({ recordingBlobStore: blob }),
  isUploadDisabled: false,
  setIsUploadDisabled: value => set({ isUploadDisabled: value }),
  file: undefined,
  setFile: file => set({ file: file }),
  audioLink: undefined,
  setAudioLink: link => set({ audioLink: link }),
  formIsCleared: false,
  setFormIsCleared: cleared => set({ formIsCleared: cleared }),
}));

export default useVcStore;
