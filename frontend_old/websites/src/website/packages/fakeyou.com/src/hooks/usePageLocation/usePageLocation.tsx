import { useLocation } from "react-router-dom";

export default function usePageLocation() {
  const location = useLocation();
  const pathname = location.pathname;

  return {
    isOnLandingPage: pathname === "/",
    isOnLoginPage: pathname.includes("/login"),
    isOnSignUpPage: pathname.includes("/signup"),
    isOnStudioPage: pathname.includes("/studio"),
    isOnBetaKeyRedeemPage: pathname.includes("/beta-key/redeem"),
    isOnWaitlistSuccessPage: pathname.includes("/waitlist-next-steps"),
    isOnCreatorOnboardingPage: pathname.includes("/creator-onboarding"),
    isOnWelcomePage: pathname === "/welcome",
    isOnTtsPage: pathname.includes("/tts"),
    isOnVcPage: pathname.includes("/voice-conversion"),
    isOnBetaForm: pathname.includes("/beta") && pathname.includes("/form"),
  };
}
