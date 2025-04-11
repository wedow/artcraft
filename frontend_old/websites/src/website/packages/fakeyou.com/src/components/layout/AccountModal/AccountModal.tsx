import React, { useState } from "react";
import { a, useTransition } from "@react-spring/web";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { Spinner } from "components/common";
import useLogin from "./useLogin";
import useSignup from "./useSignup";
import LoginView from "./LoginView";
import SignupView from "./SignupView";
import { Analytics } from "common/Analytics";
import "./AccountModal.scss";

interface AccountModalSubviewProps {
  animating: boolean;
  isLeaving: boolean;
  loginMessage?: string;
  render: any;
  signupMessage?: string;
  style: any;
}

export enum AccountModalView {
  Signup,
  Login,
}

const AccountModalSubview = ({
  animating,
  isLeaving,
  render: Render,
  style,
  ...rest
}: AccountModalSubviewProps) => (
  <a.div
    {...{
      style: {
        ...style,
        position: isLeaving && animating ? "absolute" : "relative",
      },
    }}
  >
    <Render {...{ ...rest, animating }} />
  </a.div>
);

const Loader = ({ viewLogin }: { viewLogin: boolean }) => (
  <div {...{ className: `fy-modal-page modal-spinner` }}>
    <h3> {viewLogin ? "Logging you in" : "Creating your account"} </h3>
    <Spinner />
  </div>
);

export default function AccountModal({
  handleClose,
  loginMessage,
  signupMessage,
}: {
  handleClose: any;
  loginMessage?: string;
  signupMessage?: string;
}) {
  const [view, viewSet] = useState(AccountModalView.Signup);
  const viewSwitch = () =>
    viewSet(
      view === AccountModalView.Signup
        ? AccountModalView.Login
        : AccountModalView.Signup
    );
  const viewLogin = view === AccountModalView.Login;
  const [status, statusSet] = useState(FetchStatus.paused);
  // const [viewLogin,viewLoginSet] = useState(false);
  const [animating, animatingSet] = useState(false);
  const {
    errorType,
    setProps: loginProps,
    login,
  } = useLogin({
    onSuccess: () => {
      Analytics.accountLoginSuccess();
      handleClose();
    },
    status,
    statusSet,
  });
  const { setProps: signupProps, signup } = useSignup({
    onSuccess: () => {
      Analytics.accountSignupAttempt();
      handleClose();
    },
    status,
    statusSet,
  });

  const index = status === FetchStatus.in_progress ? 2 : viewLogin ? 1 : 0;

  const amt = 5;

  const transitions = useTransition(index, {
    config: { mass: 1, tension: 80, friction: 10 },
    from: { opacity: 0, transform: `translateX(${viewLogin ? amt : -amt}rem)` },
    enter: { opacity: 1, transform: `translateX(0)` },
    leave: {
      opacity: 0,
      transform: `translateX(${viewLogin ? -amt : amt}rem)`,
    },
    onRest: () => animatingSet(false),
    onStart: () => animatingSet(true),
  });

  return (
    <div {...{ className: "fy-login-modal" }}>
      {transitions((style: any, i: number, state: any) => {
        let isLeaving = state.phase === "leave";
        let sharedProps = {
          animating,
          handleClose,
          isLeaving,
          style,
          viewLogin,
          viewSwitch,
        };

        switch (i) {
          case 0:
            return (
              <AccountModalSubview
                {...{
                  render: SignupView,
                  signupProps,
                  signup,
                  signupMessage,
                  ...sharedProps,
                }}
              />
            );
          case 1:
            return (
              <AccountModalSubview
                {...{
                  errorType,
                  login,
                  loginMessage,
                  loginProps,
                  render: LoginView,
                  ...sharedProps,
                }}
              />
            );
          case 2:
            return (
              <AccountModalSubview {...{ render: Loader, ...sharedProps }} />
            );
        }
      })}
    </div>
  );
}
