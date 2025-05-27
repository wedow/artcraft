import { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";
import { Key, KeyGroup, Mouse, Plus } from "./ControlsTopButtons/Help/Help";
import { CloseButton } from "@storyteller/ui-close-button";

const STORAGE_KEY = "onboarding_helper_dismissed";
const EXPIRATION_DAYS = 3;

export const OnboardingHelper = () => {
  const [actionPerformed, setActionPerformed] = useState(false);
  const [keyPressed, setKeyPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if the helper was dismissed
    const dismissedData = localStorage.getItem(STORAGE_KEY);
    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      const expirationTime = timestamp + EXPIRATION_DAYS * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      if (Date.now() < expirationTime) {
        setIsVisible(false);
      } else {
        // Clear expired data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Store dismissal timestamp
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
      }),
    );
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["W", "A", "S", "D"].includes(event.key.toUpperCase())) {
        setTimeout(() => setKeyPressed(true), 200);
      }
    };

    const handleAction = () => {
      setTimeout(() => setActionPerformed(true), 200);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleAction);
    window.addEventListener("dragstart", handleAction);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleAction);
      window.removeEventListener("dragstart", handleAction);
    };
  }, []);

  return (
    <Transition
      show={isVisible && !(actionPerformed && keyPressed)}
      enter="transition-opacity duration-500"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-500"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="glass pointer-events-none absolute left-1/2 top-48 z-10 flex -translate-x-1/2 transform items-center justify-center gap-2 rounded-2xl border-2 border-brand-primary !bg-brand-primary/10 px-5 py-4">
        <div className="flex items-center">
          <p className="pr-3 text-lg font-semibold">Hold</p>
          <Mouse button="left" />
          <p className="text-lg font-semibold">and drag</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Plus />
            <KeyGroup>
              <Key button="W" />
              <Key button="A" />
              <Key button="S" />
              <Key button="D" />
            </KeyGroup>
          </div>
        </div>
        <p className="text-lg font-semibold">to move around the scene</p>
        <div className="pointer-events-auto ml-2">
          <CloseButton onClick={handleClose} />
        </div>
      </div>
    </Transition>
  );
};

export default OnboardingHelper;
