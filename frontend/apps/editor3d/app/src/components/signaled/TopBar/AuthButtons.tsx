import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
import { Button } from "@storyteller/ui-button";
import ProfileDropdown from "./ProfileDropdown";

export const AuthButtons = ({ loginSignUpPressed }: { loginSignUpPressed: () => void }) => {
  useSignals();

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
              loginSignUpPressed()
            }}
          >
            Login / Sign Up
          </Button>
        </div>
      </>
    );
  }
};