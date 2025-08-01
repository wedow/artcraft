import { faEnvelope, faKey, faUser } from "@fortawesome/pro-solid-svg-icons";
import { GlobalSettingsManager } from "./pages/PageEnigma/GlobalSettingsManager";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { addToast, authentication, signUp } from "~/signals";
import { FormEvent, useRef, useState, StrictMode } from "react";
import { AUTH_STATUS, ToastTypes } from "~/enums";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useNavigate, useSearchParams, BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

import "./styles/normalize.css";
import "./styles/tailwind.css";
import "./styles/base.css";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { config } from "@fortawesome/fontawesome-svg-core";

config.autoAddCss = false; /* eslint-disable import/first */

const regEx =
  /^(([^<>()[\].,;:\s@"]+(.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

// TODO(bt,2025-04-19): Make these configurable
const ENV = {
  GOOGLE_API: "https://studio.storyteller.ai",
  FUNNEL_API: "https://studio.storyteller.ai",
  CDN_API: "https://cdn-2.fakeyou.com",
  GRAVATAR_API: "https://studio.storyteller.ai",
  DEPLOY_PRIME_URL: "https://studio.storyteller.ai",
};

export default function SignUpScreen() {
  useSignals();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmationError, setPasswordConfirmationError] =
    useState("");
  const [searchParams] = useSearchParams();
  const { status: authStatus } = authentication;

  const handleOnSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (formRef.current) {
      const form = new FormData(formRef.current);
      const email = form.get("email")?.toString();
      const password = form.get("password")?.toString();
      const passwordConfirmation = form
        .get("password-confirmation")
        ?.toString();
      const username = form.get("username")?.toString();
      setUsernameError("");
      if (!username || username.length < 6) {
        setUsernameError("Username must be at least 6 characters long");
      }
      setEmailError("");
      if (!email || !email.match(regEx)) {
        setEmailError("Email must be a valid email address");
      }
      setPasswordError("");
      if (!password || password.length < 8) {
        setPasswordError("Password must be at least 8 characters long");
      }
      setPasswordConfirmationError("");
      if (!passwordError && passwordConfirmation !== password) {
        setPasswordConfirmationError("Passwords do not match");
      }

      if (
        !usernameError &&
        !passwordError &&
        !emailError &&
        !passwordConfirmationError &&
        signUp
      ) {
        signUp({
          username: username!,
          email: email!,
          password: password!,
          passwordConfirmation: passwordConfirmation!,
        }).then((error) => {
          console.log("Error occured", error);
          if (error) {
            addToast(ToastTypes.ERROR, error);
          }
        });
      }
    }
  }; // end handleOnSubmit

  useSignalEffect(() => {
    const redirectPath = searchParams.get("redirect");
    if (authStatus.value === AUTH_STATUS.LOGGED_IN) {
      navigate(redirectPath ? redirectPath : "/");
      return;
    }
    if (authStatus.value === AUTH_STATUS.NO_ACCESS) {
      window.open("https://storyteller.ai/", "_self");
      return;
    }
  });

  return (
    <div className="fixed flex h-full w-full flex-col items-center justify-center overflow-auto bg-[#1b1b1f] bg-center bg-repeat">
      <div className="mb-7 flex w-10/12 max-w-2xl items-center justify-center gap-4">
        <img
          src="/resources/images/artcraft-logo-3.png"
          alt="ArtCraft Logo"
          className="h-9 select-none"
        />
      </div>
      <div className="w-full max-w-xl rounded-xl shadow-lg">
        <div className="glass glass-no-hover relative mx-auto w-full rounded-none rounded-t-xl p-6 shadow-none">
          <h1 className="mb-8 text-center text-2xl font-bold">Sign up</h1>
          <form
            ref={formRef}
            onSubmit={handleOnSubmit}
            className="flex flex-col gap-4"
          >
            <Input
              label="Username"
              icon={faUser}
              placeholder="Username"
              name="username"
              errorMessage={usernameError}
              required
            />
            <Input
              type="email"
              label="Email"
              icon={faEnvelope}
              placeholder="Email"
              name="email"
              errorMessage={emailError}
              required
            />
            <Input
              type="password"
              label="Password"
              icon={faKey}
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              errorMessage={passwordError}
              required
            />
            <Input
              type="password"
              label="Password Confirmation"
              icon={faKey}
              placeholder="Password Confirmation"
              name="password-confirmation"
              errorMessage={passwordConfirmationError}
              required
            />
            <Button className="mt-4 py-3">Sign up</Button>
          </form>
        </div>
        <div className="align-items flex w-full max-w-xl rounded-b-xl bg-ui-controls px-6 py-4">
          <div className="flex w-full justify-start gap-1 text-sm">
            <p className="opacity-75"></p>
            <a
              href="/"
              className="font-medium text-brand-primary-400 hover:text-brand-primary-300"
            >
              Back
            </a>
          </div>
          <div className="flex w-full justify-end gap-1 text-sm">
            <p className="opacity-75">Already have an account?</p>
            <a
              href="/login"
              className="font-medium text-brand-primary-400 hover:text-brand-primary-300"
            >
              Log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO: Replace environment variables from `root.tsx`
createRoot(document.getElementById("root")!).render(
  <>
    <StrictMode>
      <BrowserRouter>
        <GlobalSettingsManager env={ENV} />
        <SignUpScreen />
      </BrowserRouter>
    </StrictMode>
  </>,
);
