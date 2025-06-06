import { Button } from "@storyteller/ui-button";
import { Transition, TransitionChild } from "@headlessui/react";
import { createPortal } from "react-dom";
import { useState, useEffect, useRef } from "react";
import {
  faArrowRight,
  faRightToBracket,
} from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { IsDesktopApp } from "@storyteller/tauri-utils";
import {
  CheckSoraSession,
  SoraSessionState,
  useSoraLoginListener,
} from "@storyteller/tauri-api";
import { invoke } from "@tauri-apps/api/core";
import { ArtCraftSignUp } from "./artcraft-signup";
import { UsersApi } from "@storyteller/api";
interface LoginModalProps {
  onClose: () => void;
  videoSrc2D?: string;
  videoSrc3D?: string;
  openAiLogo?: string;
  onOpenChange?: (isOpen: boolean) => void;
  onArtCraftAuthSuccess?: (userInfo: any) => void;
}

export function LoginModal({
  onClose,
  videoSrc2D,
  videoSrc3D,
  openAiLogo,
  onOpenChange,
  onArtCraftAuthSuccess,
}: LoginModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedInArtCraft, setIsLoggedInArtCraft] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const artCraftFormRef = useRef<HTMLFormElement>(null);
  const [initialArtCraftLoginStatusForUI, setInitialArtCraftLoginStatusForUI] =
    useState<boolean | null>(null);
  const [initialSoraSessionStatusForUI, setInitialSoraSessionStatusForUI] =
    useState<boolean | null>(null);

  // Determine total steps and current step for UI
  let uiTotalSteps = 4;
  let uiCurrentStep = step;
  if (initialSoraSessionStatusForUI) {
    // If Sora session exists, remove the Sora step (step 3)
    uiTotalSteps = 3;
    if (step === 1) uiCurrentStep = 1;
    else if (step === 2) uiCurrentStep = 2;
    else if (step === 4) uiCurrentStep = 3;
  } else if (initialArtCraftLoginStatusForUI) {
    // If ArtCraft is logged in but not Sora, keep 4 steps
    uiTotalSteps = 4;
    if (step === 1) uiCurrentStep = 1;
    else if (step === 3) uiCurrentStep = 2;
    else if (step === 4) uiCurrentStep = 3;
  }

  const initSession = async () => {
    const result = await CheckSoraSession();
    const sessionExists = result.state === SoraSessionState.Valid;
    return sessionExists;
  };

  const checkArtCraftLogin = async () => {
    const usersApi = new UsersApi();
    const session = await usersApi.GetSession();
    const loggedIn = session.data?.loggedIn;
    return loggedIn;
  };

  useSoraLoginListener((payload: any) => {
    console.log("Login success!", payload);
    setStep(4); // Always go to the final step after Sora login
  });

  // Check session on component mount
  useEffect(() => {
    // Run both checks in parallel
    Promise.all([initSession(), checkArtCraftLogin()]).then(
      ([soraSessionExists, loggedIn]) => {
        setInitialArtCraftLoginStatusForUI(loggedIn || false); // Set initial status for UI step counting
        setInitialSoraSessionStatusForUI(soraSessionExists || false); // Set initial Sora status for UI step counting

        if (soraSessionExists && loggedIn) {
          setIsLoggedInArtCraft(true);
          setIsOpen(false); // Close the modal if fully logged in
          return;
        } else if (soraSessionExists && !loggedIn) {
          // Sora session exists, but not logged in to ArtCraft
          setIsOpen(true);
          setStep(2);
          setIsLoggedInArtCraft(false);
        } else if (!soraSessionExists && loggedIn) {
          // No Sora session, but logged in to ArtCraft
          setIsOpen(true);
          setStep(3);
          setIsLoggedInArtCraft(true);
        } else if (!soraSessionExists) {
          // No Sora session, start at step 1
          setIsOpen(true);
          setStep(1);
          setIsLoggedInArtCraft(false); // Ensure this is also set
        }
      }
    );
  }, []);

  useEffect(() => {
    if (onOpenChange) onOpenChange(isOpen);
  }, [isOpen, onOpenChange]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleNext = async () => {
    if (step === 3) {
      setIsLoading(true);
      try {
        if (IsDesktopApp()) {
          await invoke("open_sora_login_command");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const result = await CheckSoraSession();
          const sessionExists = result.state === SoraSessionState.Valid;
          if (sessionExists) {
            setStep(4); // Always go to the final step after Sora login
          }
        } else {
          alert("Please open the desktop app to login");
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const sessionExists = true;
          if (sessionExists) {
            setStep(4); // Always go to the final step after Sora login
          }
        }
      } catch (error) {
        console.error("Login failed:", error);
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      // Trigger the form submit in ArtCraftSignUp
      if (artCraftFormRef.current) {
        artCraftFormRef.current.requestSubmit();
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Progress bar rendering
  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[...Array(uiTotalSteps)].map((_, idx) => (
        <div
          key={idx}
          className={`h-1.5 rounded transition-all duration-300 w-16 ${
            idx < uiCurrentStep ? "bg-primary" : "bg-white/30"
          }`}
        />
      ))}
    </div>
  );

  // Step content rendering
  const renderStepContent = () => {
    if (step === 2 && isLoggedInArtCraft) {
      setStep(3);
      return null;
    }
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
          <ArtCraftSignUp
            onSubmit={async (
              username,
              email,
              password,
              passwordConfirmation
            ) => {
              setIsLoading(true);
              const usersApi = new UsersApi();
              try {
                let signupResponse, loginResponse;
                if (isSignUp) {
                  signupResponse = await usersApi.Signup({
                    username,
                    email,
                    password,
                    passwordConfirmation,
                  });
                  if (!signupResponse.success) {
                    setErrorMessage(
                      signupResponse.errorMessage ||
                        "Signup failed, please try again."
                    );
                    setIsLoading(false);
                    return;
                  }
                  loginResponse = await usersApi.Login({
                    usernameOrEmail: username || email,
                    password,
                  });
                  if (!loginResponse.success) {
                    setErrorMessage(
                      loginResponse.errorMessage ||
                        "Login after signup failed, please try again. "
                    );
                    setIsLoading(false);
                    return;
                  }
                } else {
                  loginResponse = await usersApi.Login({
                    usernameOrEmail: username || email,
                    password,
                  });
                  if (!loginResponse.success) {
                    setErrorMessage(
                      loginResponse.errorMessage ||
                        "Login failed, please try again."
                    );
                    setIsLoading(false);
                    return;
                  }
                }
                setIsLoggedInArtCraft(true);
                if (onArtCraftAuthSuccess) {
                  const session = await usersApi.GetSession();
                  const userInfo = session.data?.user;
                  if (userInfo) onArtCraftAuthSuccess(userInfo);
                }
                // Check for Sora session and skip to step 4 if present
                const soraSessionExists = await initSession();
                if (soraSessionExists) {
                  setStep(4);
                } else {
                  setStep(3);
                }
              } catch (e) {
                console.error(e);
                setErrorMessage(
                  "An unexpected error occurred. Please try again."
                );
              } finally {
                setIsLoading(false);
              }
            }}
            isSignUp={isSignUp}
            onToggleMode={() => setIsSignUp((prev) => !prev)}
            formRef={artCraftFormRef}
            errorMessage={errorMessage}
          />
        );
      case 3:
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
      case 4:
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
          <div className="fixed inset-0 cursor-pointer bg-black/80" />
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
                  Step {uiCurrentStep} of {uiTotalSteps}
                </span>
                {renderProgress()}
                {renderStepContent()}
                <div className="flex items-end justify-center gap-2.5 mt-10 grow">
                  {step === 2 ? (
                    <Button
                      variant="secondary"
                      onClick={handleBack}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  ) : null}
                  {step === 3 && (
                    <Button
                      variant="secondary"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      Skip for now
                    </Button>
                  )}
                  {step === 4 ? (
                    <Button
                      icon={faArrowRight}
                      iconFlip={true}
                      onClick={handleClose}
                    >
                      Start Creating Now
                    </Button>
                  ) : (
                    <>
                      <Button
                        icon={step === 3 ? faRightToBracket : faArrowRight}
                        iconFlip={step !== 3}
                        onClick={handleNext}
                        loading={isLoading}
                        disabled={isLoading}
                      >
                        {step === 1
                          ? "Continue"
                          : step === 2
                          ? isSignUp
                            ? "Sign up"
                            : "Login"
                          : "Login with OpenAI"}
                      </Button>
                    </>
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
