import { useRef } from "react";
import { BrowserRouter } from 'react-router-dom';
import { StrictMode } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";

import { faKey, faUser } from "@fortawesome/pro-solid-svg-icons";

import { AUTH_STATUS } from "~/enums";
import { authentication, login, logout } from "~/signals";
import { createRoot } from "react-dom/client";

import {
  Button,
  H1,
  Input,
  Link,
  P,
  LoadingDots,
  ConfirmationModal,
} from "~/components";

import "./styles/normalize.css";
import "./styles/tailwind.css";
import "./styles/base.css";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { config } from "@fortawesome/fontawesome-svg-core";
import { GlobalSettingsManager } from "./pages/PageEnigma/GlobalSettingsManager";

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
  }; // end handleOnSubmit

  useSignalEffect(() => {
    const redirectPath = searchParams.get("redirect");
    if (authStatus.value === AUTH_STATUS.LOGGED_IN) {
      navigate(redirectPath ? redirectPath : "/");
    }
  });

  return (
    <div className="fixed w-full" style={{ height: "calc(100% - 72px)" }}>
      <div className="mx-auto my-6 w-10/12 max-w-2xl">
        <H1 className="text-center text-[32px] font-bold">
          Login to Storyteller
        </H1>
      </div>
      <div className="relative mx-auto my-6 w-10/12 max-w-2xl overflow-hidden rounded-lg border border-ui-panel-border bg-ui-panel p-6">
        <form
          ref={formRef}
          onSubmit={handleOnSumbit}
          className="flex flex-col gap-4"
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
          <div className="align-items mb-3 flex">
            <a
              href="https://storyteller.ai/password-reset"
              className="grow text-sm text-brand-primary transition-all duration-150 hover:text-brand-primary-400"
            >
              Forgot your password?
            </a>
            <div className="flex justify-end gap-1 text-sm">
              <P>Don&apos;t have an account?</P>
              <Link 
                to="/signup"
                reloadDocument={true} // TODO(bt,2025-04-19): Once we have in-page routing, get rid of this.
                >Sign Up</Link>
            </div>
          </div>

          <Button className="h-11 w-full text-[15px]">Login</Button>
        </form>
        <LoadingDots
          className="absolute left-0 top-0 h-full w-full"
          isShowing={shouldShowLoader}
          message={authLoaderMessage}
          type="bricks"
        />
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
        <LoginScreen/>
      </BrowserRouter>
    </StrictMode>
  </>
);
