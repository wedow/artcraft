import React, { createContext } from "react";
import { ModalConfig, useModalState } from "hooks";

import ModalLayer from "./ModalLayer";

interface ModalProviderProps {
  children?: any;
}

export interface ModalContextShared {
  close: () => void;
  modalOpen: boolean;
  modalState: ModalConfig | null;
  open: (cfg: ModalConfig) => void;
}

export const ModalContext = createContext<ModalContextShared>({
  close: () => { },
  open: () => { },
  modalOpen: false,
  modalState: null,
});


// how this works
//
// When modalState is set via open(), modalOpen is set to true to via useEffect
// this is to separate modal rendering (modalOpen) from its state (modalState) to achieve smooth transitions.
//
// When close() is run, modalOpen is set to false triggering a ModalLayer transition,
// and killModal is set to true to indicate an exiting transition.
// When the transition is complete onModalCloseEnd() runs, and because killModal is true
// modalState will be cleared, ensuring the state is cleared only when the modal is no longer rendered.

export default function ModalProvider({ children }: ModalProviderProps) {
  const { close, killModal, modalOpen, modalState, onModalCloseEnd, open } =
    useModalState({});

  return (
    <ModalContext.Provider
      {...{ value: { close, open, modalOpen, modalState } }}
    >
      {children}
      <ModalLayer
        {...{
          content: modalState?.component,
          contentProps: modalState?.props,
          close,
          // debug: "ModalProvider",
          killModal,
          lockTint: modalState?.lockTint,
          modalOpen,
          onModalCloseEnd,
          padding: modalState?.padding,
          scroll: modalState?.scroll,
          width: modalState?.width,
        }}
      />
    </ModalContext.Provider>
  );
}
