import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";

export type ModalWidth = "wide" | "narrow" | "small" | "square";

export interface ModalConfig {
  component: React.ElementType;
  lockTint?: boolean;
  padding?: boolean;
  onModalClose?: () => void;
  onModalOpen?: () => void;
  props?: any;
  scroll?: boolean;
  width?: ModalWidth;
}

export default function useModalState({ debug = "" }) {
  const [modalState, modalStateSet] = useState<ModalConfig | null>(null);
  const [modalOpen, modalOpenSet] = useState(false);
  const [killModal, killModalSet] = useState(false);

  if (debug) {
    console.log(`💬 useModalState at ${debug}`, {
      modalState,
      modalOpen,
      killModal,
    });
  }

  const open = (cfg: ModalConfig) => {
    if (debug) {
      console.log(`🚪 useModalState open() at ${debug}`, { cfg });
    }
    if (cfg.onModalOpen) {
      cfg.onModalOpen();
    }
    modalStateSet(cfg);
  };

  const close = () => {
    if (debug) {
      console.log(`🔥 useModalState close() at ${debug}`);
    }
    if (modalState?.onModalClose) {
      modalState.onModalClose();
    }
    killModalSet(true);
    modalOpenSet(false);
  };

  const onModalCloseEnd = () => {
    if (killModal && modalState) {
      killModalSet(false);
      modalStateSet(null);
    }
  };

  useEffect(() => {
    // Prevent body scrolling when modal is open on mobile
    if (modalOpen && isMobile) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    if (!killModal && modalState && !modalOpen) {
      modalOpenSet(true);
    }
  }, [killModal, modalOpen, modalOpenSet, modalState]);

  return {
    close,
    killModal,
    killModalSet,
    modalOpen,
    modalOpenSet,
    modalState,
    modalStateSet,
    onModalCloseEnd,
    open,
  };
}
