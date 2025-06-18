import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
import { Button } from "@storyteller/ui-button";
import ProfileDropdown from "./ProfileDropdown";
import { LoginModal } from "@storyteller/ui-login-modal";
import { useState } from "react";
import {
  disableHotkeyInput,
  DomLevels,
  enableHotkeyInput,
} from "~/pages/PageEnigma/signals";

export const AuthButtons = () => {
  useSignals();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const { status, userInfo } = authentication;

  console.log("Current State:");
  console.log(status.value);
  if (status.value === AUTH_STATUS.LOGGED_IN) {
    console.log("SHOWING DROPDOWN");
    return <ProfileDropdown />;
  } else {
    return (
      <>
        <div className="flex items-center gap-3.5">
          <span className="text-white/20">|</span>
          <Button
            className="h-[38px]"
            onClick={() => {
              setIsSignUp(true);
              setShowLoginModal(true);
            }}
          >
            Login / Sign Up
          </Button>
        </div>

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            isSignUp={isSignUp}
            videoSrc2D="/resources/videos/artcraft-canvas-demo.mp4"
            videoSrc3D="/resources/videos/artcraft-3d-demo.mp4"
            onArtCraftAuthSuccess={(userInfo_value) => {
              userInfo.value = userInfo_value;
              status.value = AUTH_STATUS.LOGGED_IN;
              setShowLoginModal(false);
            }}
            onOpenChange={(isOpen: boolean) => {
              if (isOpen) {
                disableHotkeyInput(DomLevels.DIALOGUE);
              } else {
                enableHotkeyInput(DomLevels.DIALOGUE);
              }
            }}
          />
        )}
      </>
    );
  }
};
