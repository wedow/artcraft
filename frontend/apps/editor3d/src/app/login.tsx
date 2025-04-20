import { useRef, StrictMode } from "react";
import { useNavigate, useSearchParams, BrowserRouter } from "react-router-dom";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";

import {
  faKey,
  faSpinnerThird,
  faUser,
} from "@fortawesome/pro-solid-svg-icons";

import { AUTH_STATUS } from "~/enums";
import { authentication, login, logout } from "~/signals";
import { createRoot } from "react-dom/client";

import { Button, Input, ConfirmationModal } from "~/components";

import "./styles/normalize.css";
import "./styles/tailwind.css";
import "./styles/base.css";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { config } from "@fortawesome/fontawesome-svg-core";
import { GlobalSettingsManager } from "./pages/PageEnigma/GlobalSettingsManager";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

config.autoAddCss = false; /* eslint-disable import/first */

// TODO(bt,2025-04-19): Make these configurable
const ENV = {
  BASE_API: "https://api.storyteller.ai",
  GOOGLE_API: "https://studio.storyteller.ai",
  FUNNEL_API: "https://studio.storyteller.ai",
  CDN_API: "https://cdn-2.fakeyou.com",
  GRAVATAR_API: "https://studio.storyteller.ai",
  DEPLOY_PRIME_URL: "https://studio.storyteller.ai",
};

export default function LoginScreen() {
  useSignals();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const formRef = useRef<HTMLFormElement | null>(null);
  const { status: authStatus } = authentication;
  const authLoaderMessage = getAuthLoaderMessage();
  const shouldShowLoader = checkShouldShowLoader();

  const showNoAccessModal = authStatus.value === AUTH_STATUS.NO_ACCESS;

  const handleOnSumbit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (formRef.current) {
      const form = new FormData(formRef.current);
      const usernameOrEmail = form.get("usernameOrEmail")?.toString();
      const password = form.get("password")?.toString();
      if (usernameOrEmail && password && login) {
        login({
          usernameOrEmail,
          password,
        });
      }
    }
  };

  useSignalEffect(() => {
    const redirectPath = searchParams.get("redirect");
    if (authStatus.value === AUTH_STATUS.LOGGED_IN) {
      navigate(redirectPath ? redirectPath : "/");
    }
  });

  return (
    <div className="fixed flex h-full w-full flex-col items-center justify-center bg-[#1b1b1f] bg-center bg-repeat">
      <div className="mb-7 flex w-10/12 max-w-2xl items-center justify-center gap-4">
        <img
          src="/resources/images/artcraft-logo-3.png"
          alt="ArtCraft Logo"
          className="h-9 select-none"
        />
      </div>
      <div className="w-full max-w-xl rounded-xl shadow-lg">
        <div className="glass glass-no-hover relative mx-auto w-full rounded-none rounded-t-xl p-6 shadow-none">
          <h1 className="mb-8 text-center text-2xl font-bold">
            Log in to 3D Stage Editor
          </h1>
          <form
            ref={formRef}
            onSubmit={handleOnSumbit}
            className={twMerge(
              "flex flex-col gap-4",
              shouldShowLoader && "opacity-0",
            )}
          >
            <Input
              label="Username or Email"
              icon={faUser}
              name="usernameOrEmail"
              placeholder="Username or Email"
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              icon={faKey}
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <Button className="mt-4 py-3">Continue</Button>
          </form>
          {shouldShowLoader && (
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-black/50">
              <div className="flex items-center text-center">
                <FontAwesomeIcon
                  icon={faSpinnerThird}
                  className="animate-spin"
                />
                <p className="text-sm text-white">{authLoaderMessage}</p>
              </div>
            </div>
          )}
        </div>
        <div className="align-items flex w-full max-w-xl rounded-b-xl bg-ui-controls px-6 py-4">
          <a
            href="https://storyteller.ai/password-reset"
            className="grow text-sm font-medium !text-brand-primary-400 transition-all duration-150 hover:!text-brand-primary-300"
          >
            Forgot your password?
          </a>
          <div className="flex justify-end gap-1 text-sm">
            <p className="opacity-75">Don&apos;t have an account?</p>
            <a
              href="/signup"
              className="font-medium text-brand-primary-400 hover:text-brand-primary-300"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
      <ConfirmationModal
        text="We're in a closed beta and you'll need a beta key to use this app."
        title="Unauthorized"
        open={showNoAccessModal}
        onClose={handleClose}
        cancelText="Close"
        onCancel={handleClose}
        okText="Get Beta Key"
        onOk={() => {
          handleClose();
          if (window) {
            window.open("https://storyteller.ai/beta-key/redeem", "_blank");
          }
        }}
      />
    </div>
  );
}

const handleClose = () => {
  if (authentication.status.value !== AUTH_STATUS.LOGGED_OUT) {
    logout();
  }
};

const checkShouldShowLoader = () => {
  return (
    authentication.status.value === AUTH_STATUS.LOGGING ||
    authentication.status.value === AUTH_STATUS.LOGGED_IN
  );
};

const getAuthLoaderMessage = () => {
  if (authentication.status.value === AUTH_STATUS.LOGGED_IN) {
    return "Authenticated, Redirecting...";
  }
  if (authentication.status.value === AUTH_STATUS.GET_USER_INFO) {
    return "Getting User Info...";
  }
  return "Getting Session...";
};

// TODO: Replace environment variables from `root.tsx`
createRoot(document.getElementById("root")!).render(
  <>
    <StrictMode>
      <BrowserRouter>
        <GlobalSettingsManager env={ENV} />
        <LoginScreen />
      </BrowserRouter>
    </StrictMode>
  </>,
);
