import React from "react";
import { TempInput } from "components/common";
import { faUser, faKey } from "@fortawesome/free-solid-svg-icons";

enum ErrorTypes {
  InvalidCredentials = "abc",
  ServerError = "abc",
}

interface LoginViewProps {
  animating: boolean;
  errorType?: string;
  handleClose: (x: any) => any;
  login: (x: any) => any;
  loginMessage?: string;
  loginProps: (x: any) => any;
  viewSwitch: () => void;
}

export default function LoginView({
  animating,
  errorType = "",
  handleClose,
  login,
  loginMessage,
  loginProps,
  viewSwitch,
}: LoginViewProps) {
  const errorStrings = [
    "Could not login, check credentials and try again.",
    "A sever error occured. Try again.",
  ];

  return (
    <div
      {...{
        className: `fy-modal-page${animating ? " animating-modal-page" : ""}`,
      }}
    >
      <header>
        <div {...{ className: "login-modal-title-row" }}>
          <h3 className="fw-bold">{loginMessage || "Login"}</h3>
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
            Log into your account
          </span>
          <span
            {...{
              className: `login-modal-login-link`,
              onClick: () => {
                if (!animating) viewSwitch();
              },
            }}
          >
            Sign up instead
          </span>
        </div>
      </header>
      {errorType ? (
        <p {...{ className: "error-message" }}>
          {errorStrings[Object.keys(ErrorTypes).indexOf(errorType)]}
        </p>
      ) : null}
      <TempInput
        {...{
          icon: faUser,
          label: "Username or email",
          placeholder: "Username",
          ...loginProps("usernameOrEmail"),
        }}
      />
      <TempInput
        {...{
          icon: faKey,
          label: "Password",
          placeholder: "Enter your password",
          type: "password",
          ...loginProps("password"),
        }}
      />
      <button
        {...{
          className: "btn btn-primary w-100 mt-4",
          disabled: animating,
          onClick: login,
        }}
      >
        Login
      </button>
    </div>
  );
}
