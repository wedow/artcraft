import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";
import { ButtonLink } from "@storyteller/ui-button-link";
import ProfileDropdown from "./ProfileDropdown";

export const AuthButtons = () => {
  useSignals();

  const { status } = authentication;

  if (status.value === AUTH_STATUS.LOGGED_IN) {
    return <ProfileDropdown />;
  } else {
    return (
      <div className="flex items-center gap-3.5">
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-2">
          <ButtonLink
            to="/login"
            variant="secondary"
            reloadDocument={true}
            className="h-[38px]" // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
          >
            Login
          </ButtonLink>
          <ButtonLink
            to="/signup"
            reloadDocument={true}
            className="h-[38px]" // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
          >
            Sign Up
          </ButtonLink>
        </div>
      </div>
    );
  }
};
