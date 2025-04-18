import { useSignals } from "@preact/signals-react/runtime";

import { AUTH_STATUS } from "~/enums";
import { authentication } from "~/signals";

import { ButtonLink } from "~/components";
import ProfileDropdown from "./ProfileDropdown";

export const AuthButtons = () => {
  useSignals();

  const { status } = authentication;

  if (status.value === AUTH_STATUS.LOGGED_IN) {
    return <ProfileDropdown />;
  } else {
    return (
      <>
        <ButtonLink 
          to="/login"
          variant="secondary" 
          reloadDocument={true} // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
        >
          Login
        </ButtonLink>
        <ButtonLink 
          to="/signup"
          reloadDocument={true} // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
          >Sign Up</ButtonLink>
      </>
    );
  }
};
