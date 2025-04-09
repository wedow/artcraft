import { create } from "zustand";

interface SeedVCStoreState {
  mediaUploadTokenReference: string | undefined;
  setMediaUploadTokenReference: (token: string | undefined) => void;
  mediaUploadTokenSource: string | undefined;
  setMediaUploadTokenSource: (token: string | undefined) => void;
  hasUploadedFileReference: boolean;
  setHasUploadedFileReference: (value: boolean) => void;
  hasUploadedFileSource: boolean;
  setHasUploadedFileSource: (value: boolean) => void;
  hasRecordedFileSource: boolean;
  setHasRecordedFileSource: (value: boolean) => void;
  recordingBlobStoreSource: Blob | undefined;
  setRecordingBlobStoreSource: (blob: Blob | undefined) => void;
  isUploadDisabledSource: boolean;
  setIsUploadDisabledSource: (value: boolean) => void;
  isUploadDisabledReference: boolean;
  setIsUploadDisabledReference: (value: boolean) => void;
  fileSource: any;
  setFileSource: (file: any) => void;
  fileReference: any;
  setFileReference: (file: any) => void;
  audioLinkSource: string | undefined;
  setAudioLinkSource: (link: string | undefined) => void;
  audioLinkReference: string | undefined;
  setAudioLinkReference: (link: string | undefined) => void;
  formIsClearedSource: boolean;
  setFormIsClearedSource: (cleared: boolean) => void;
  formIsClearedReference: boolean;
  setFormIsClearedReference: (cleared: boolean) => void;
}

const useSeedVCStore = create<SeedVCStoreState>(set => ({
  mediaUploadTokenReference: undefined,
  setMediaUploadTokenReference: token =>
    set({ mediaUploadTokenReference: token }),
  mediaUploadTokenSource: undefined,
  setMediaUploadTokenSource: token => set({ mediaUploadTokenSource: token }),
  hasUploadedFileReference: false,
  setHasUploadedFileReference: value =>
    set({ hasUploadedFileReference: value }),
  hasUploadedFileSource: false,
  setHasUploadedFileSource: value => set({ hasUploadedFileSource: value }),
  hasRecordedFileSource: false,
  setHasRecordedFileSource: value => set({ hasRecordedFileSource: value }),
  recordingBlobStoreSource: undefined,
  setRecordingBlobStoreSource: blob => set({ recordingBlobStoreSource: blob }),
  isUploadDisabledSource: false,
  setIsUploadDisabledSource: value => set({ isUploadDisabledSource: value }),
  isUploadDisabledReference: false,
  setIsUploadDisabledReference: value =>
    set({ isUploadDisabledReference: value }),
  fileSource: undefined,
  setFileSource: file => set({ fileSource: file }),
  fileReference: undefined,
  setFileReference: file => set({ fileReference: file }),
  audioLinkSource: undefined,
  setAudioLinkSource: link => set({ audioLinkSource: link }),
  audioLinkReference: undefined,
  setAudioLinkReference: link => set({ audioLinkReference: link }),
  formIsClearedSource: false,
  setFormIsClearedSource: cleared => set({ formIsClearedSource: cleared }),
  formIsClearedReference: false,
  setFormIsClearedReference: cleared =>
    set({ formIsClearedReference: cleared }),
}));

export default useSeedVCStore;
