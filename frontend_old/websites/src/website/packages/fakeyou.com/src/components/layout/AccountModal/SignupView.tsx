import React from "react";
import { TempInput } from "components/common";
import { faUser, faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";

interface SignupViewProps {
  animating: boolean;
  handleClose: (x: any) => any;
  signupProps: (x: any) => any;
  signup: (x: any) => any;
  signupMessage?: string;
  viewSwitch: () => void;
}

export default function LoginView({
  animating,
  handleClose,
  signupProps,
  signup,
  signupMessage,
  viewSwitch,
}: SignupViewProps) {
  return (
    <div
      {...{
        className: `fy-modal-page${animating ? " animating-modal-page" : ""}`,
      }}
    >
      <header>
        <div {...{ className: "login-modal-title-row" }}>
          <h3 className="fw-bold">{signupMessage || "Signup"}</h3>
          <button
            {...{
              ariaLabel: "Close",
              className: "btn-close",
              onClick: handleClose,
              type: "button",
            }}
          />
        </div>
        <div {...{ className: "login-modal-subtitle-row mt-3 fw-medium" }}>
          <span {...{ className: "login-modal-subtitle" }}>
            Create a new account
          </span>
          <span
            {...{
              className: "login-modal-login-link",
              onClick: () => {
                if (!animating) {
                  viewSwitch();
                }
              },
            }}
          >
            Or login instead
          </span>
        </div>
      </header>
      <TempInput
        {...{
          icon: faUser,
          label: "Username",
          placeholder: "Username",
          ...signupProps("username"),
        }}
      />
      <TempInput
        {...{
          icon: faEnvelope,
          label: "Email",
          placeholder: "Email",
          ...signupProps("email"),
        }}
      />
      <TempInput
        {...{
          icon: faKey,
          label: "Password",
          placeholder: "Enter a new password",
          type: "password",
          ...signupProps("password"),
        }}
      />
      <TempInput
        {...{
          icon: faKey,
          label: "Confirm password",
          placeholder: "Confirm password",
          type: "password",
          ...signupProps("passwordConfirm"),
        }}
      />
      <button
        {...{
          className: "btn btn-primary w-100 mt-4",
          disabled: animating,
          onClick: signup,
        }}
      >
        Sign up
      </button>
    </div>
  );
}
