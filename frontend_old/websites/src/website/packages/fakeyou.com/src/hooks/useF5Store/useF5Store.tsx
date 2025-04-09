import { create } from "zustand";

interface F5StoreState {
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
  text: string;
  setText: (text: string) => void;
}

const useF5Store = create<F5StoreState>(set => ({
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
  text: "",
  setText: text => set({ text }),
}));

export default useF5Store;
