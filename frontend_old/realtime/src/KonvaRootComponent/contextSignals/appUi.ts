import { useCallback, useRef } from "react";
import { signal } from "@preact/signals-react";

export interface AppUiContextInterface {
  resetAll: () => void;
  openAddImage: (file?: File) => void;
  openAddVideo: (file?: File) => void;
  openAIStylize: () => void;
  openEditText: () => void;
}
export type AppUiSignalType = {
  isAddVideoOpen: boolean;
  stagedVideo: File | null;
  isAddImageOpen: boolean;
  stagedImage: File | null;
  isAiStylizeOpen: boolean;
  isEditTextOpen: boolean;
};
const appUiInitialState = {
  isAddVideoOpen: false,
  stagedVideo: null,
  isAddImageOpen: false,
  stagedImage: null,
  isAiStylizeOpen: false,
  isEditTextOpen: false,
};
export const useAppUiContext = () => {
  const appUiRef = useRef(signal<AppUiSignalType>(appUiInitialState));

  const appUiSignal = appUiRef.current;
  const resetAll = useCallback(() => {
    appUiSignal.value = appUiInitialState;
  }, []);
  const openAddImage = useCallback((file?: File) => {
    appUiSignal.value = {
      ...appUiInitialState,
      isAddImageOpen: true,
      stagedImage: file ? file : null,
    };
  }, []);
  const openAddVideo = useCallback((file?: File) => {
    appUiSignal.value = {
      ...appUiInitialState,
      isAddVideoOpen: true,
      stagedVideo: file ? file : null,
    };
  }, []);
  const openAIStylize = useCallback(() => {
    appUiSignal.value = {
      ...appUiInitialState,
      isAiStylizeOpen: true,
    };
  }, []);
  const openEditText = useCallback(() => {
    appUiSignal.value = {
      ...appUiInitialState,
      isEditTextOpen: true,
    };
  }, []);
  return {
    signal: appUiSignal,
    resetAll,
    openAddImage,
    openAddVideo,
    openAIStylize,
    openEditText,
  };
};
