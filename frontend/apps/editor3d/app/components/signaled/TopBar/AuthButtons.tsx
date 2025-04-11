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
        <ButtonLink variant="secondary" to="/login">
          Login
        </ButtonLink>
        <ButtonLink to="/signup">Sign Up</ButtonLink>
      </>
    );
  }
};
