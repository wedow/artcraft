import { useSignals } from "@preact/signals-react/runtime";
import { AUTH_STATUS } from "~/signals/authentication/enums";
import { authentication } from "~/signals";
import { ButtonLink } from "~/components/reusable/ButtonLink/ButtonLink";
import { ProfileDropdown } from "../features/ToolbarUserProfile/ProfileDropdown";

// TODO MAKE THIS A SHARED COMPONENT ART CRAFT
export const AuthButtons = () => {
  useSignals();
  const { status } = authentication.signals;
  console.log("status", status.value);

  if (status.value === AUTH_STATUS.LOGGED_IN) {
    return <ProfileDropdown />;
  } else {
    return (
      <div className="flex items-center gap-3.5">
        <span className="text-white/20">|</span>
        <div className="flex items-center gap-2">
          <ButtonLink
            to="/login"
            variant="primary"
            className="bg-[#5F5F68]/60 backdrop-blur-lg hover:bg-[#5F5F68]/90" // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
          >
            Login
          </ButtonLink>
          <ButtonLink
            to="/signup"
            variant="primary"
            className="bg-[#5F5F68]/60 backdrop-blur-lg hover:bg-[#5F5F68]/90" // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
          >
            Sign Up
          </ButtonLink>
        </div>
      </div>
    );
  }
};
