import { Button } from "@storyteller/ui-button";
import { Transition, TransitionChild } from "@headlessui/react";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import {
  faArrowRight,
  faRightToBracket,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import { invoke } from "@tauri-apps/api/core";

interface LoginModalProps {
  onClose: () => void;
  videoSrc2D: string;
  videoSrc3D: string;
  openAiLogo: string;
}

export function LoginModal({
  onClose,
  videoSrc2D,
  videoSrc3D,
  openAiLogo,
}: LoginModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const totalSteps = 3;

  const checkSession = async () => {
    // Bombay: This will be replaced with actual session check
    // For testing: return true to simulate having a session, false to simulate no session
    const sessionExists = false;
    setHasSession(sessionExists);
    return sessionExists;
  };

  // Check session on component mount
  useEffect(() => {
    const initSession = async () => {
      const sessionExists = await checkSession();
      if (!sessionExists) {
        setIsOpen(true);
        setStep(1);
      } else {
        setIsOpen(false);
      }
    };
    initSession();
  }, [hasSession]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleNext = async () => {
    if (step === 2) {
      setIsLoading(true);
      try {
        if (IsDesktopApp()) {
          await invoke("open_sora_login_command");
          const sessionExists = await checkSession();
          if (sessionExists) {
            setStep(step + 1);
          }
        } else {
          const sessionExists = true;
          alert("Please open the desktop app to login");
          if (sessionExists) {
            setStep(step + 1);
          }
        }
      } catch (error) {
        console.error("Login failed:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Progress bar rendering
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[...Array(totalSteps)].map((_, idx) => (
        <div
          key={idx}
          className={`h-1.5 rounded transition-all duration-300 w-16 ${
            idx < step ? "bg-primary" : "bg-white/30"
          }`}
        />
      ))}
    </div>
  );

  // Step content rendering
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Welcome to ArtCraft
            </h2>
            <p className="text-white/70 mb-6 text-center">
              Here's what you can do...
            </p>
            <div className="grid grid-cols-2 gap-6 h-full grow">
              <div className="h-full">
                <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 rounded-t-lg">
                  <video
                    className="object-cover w-full h-full"
                    autoPlay
                    muted
                    loop
                    controls={false}
                  >
                    <source src={videoSrc2D} type="video/mp4" />
                  </video>
                </div>
                <p className="text-center px-1.5 py-2 text-white/90 bg-black/20 rounded-b-lg font-medium text-sm">
                  2D Canvas
                </p>
              </div>
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 rounded-t-lg">
                  <video
                    className="object-cover w-full h-full"
                    autoPlay
                    muted
                    loop
                    controls={false}
                  >
                    <source src={videoSrc3D} type="video/mp4" />
                  </video>
                </div>
                <p className="text-center px-1.5 py-2 text-white/90 bg-black/20 rounded-b-lg font-medium text-sm">
                  3D Scene Editor
                </p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Login with your OpenAI account
            </h2>
            <p className="text-white/70 mb-6 text-center px-16">
              We're the application layer for images and video. To provide you
              with <b>100% free service</b>, we use your existing AI accounts.
              To start off, you'll need to add your OpenAI Sora account. If you
              have a ChatGPT subscription, you can log in with Sora.
            </p>
            <img
              src={openAiLogo}
              alt="OpenAI Logo"
              className="w-72 h-72 mx-auto grow"
            />
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Thank you for signing in!
            </h2>
            <p className="text-white/70 mb-6 text-center px-24">
              You're all set to start creating amazing content. Join our Discord
              community to connect with other creators, share your work, and get
              the latest updates.
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                window.open("https://discord.gg/75svZP2Vje", "_blank")
              }
              icon={faDiscord}
              className="text-md bg-[#5865F2] hover:bg-[#6a76ff] rounded-xl"
            >
              Join our Discord
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return createPortal(
    <Transition appear show={isOpen}>
      <div className="fixed inset-0 z-[100]">
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 cursor-pointer bg-black/60" />
        </TransitionChild>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className="relative h-[660px] max-w-4xl w-full rounded-xl bg-[#2C2C2C] text-white shadow-lg border border-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4 p-8 h-full">
                <span className="text-sm text-center opacity-60 font-medium">
                  Step {step} of {totalSteps}
                </span>
                {renderProgress()}
                {renderStepContent()}
                <div className="flex items-end justify-center gap-2.5 mt-10 grow">
                  {step > 1 && step !== 3 ? (
                    <Button
                      variant="secondary"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  ) : null}
                  {step < totalSteps ? (
                    <Button
                      icon={step === 2 ? faRightToBracket : faArrowRight}
                      iconFlip={step !== 2}
                      onClick={handleNext}
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      {step === 2 ? "Login with OpenAI" : "Continue"}
                    </Button>
                  ) : (
                    <Button
                      icon={faArrowRight}
                      iconFlip={true}
                      onClick={handleClose}
                    >
                      Start Creating Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Transition>,
    document.body
  );
}

export default LoginModal;
