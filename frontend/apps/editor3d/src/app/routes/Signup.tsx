import { faEnvelope, faKey, faUser } from "@fortawesome/pro-solid-svg-icons";
import { Button, H1, Input, Link, P } from "~/components";
import { addToast, authentication, signUp } from "~/signals";
import { FormEvent, useRef, useState } from "react";
import { AUTH_STATUS, ToastTypes } from "~/enums";
import { useSignalEffect, useSignals } from "@preact/signals-react/runtime";
import { useNavigate, useSearchParams } from "react-router-dom";

const regEx =
  /^(([^<>()[\].,;:\s@"]+(.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

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
    <div
      className="fixed w-full overflow-scroll"
      style={{ height: "calc(100% - 72px)" }}
    >
      <div className="mx-auto my-6 w-10/12 max-w-2xl">
        <H1 className="text-center">Sign Up to Storyteller</H1>
      </div>
      <div className="mx-auto my-6 w-10/12 max-w-2xl rounded-lg border border-ui-panel-border bg-ui-panel p-6">
        <form ref={formRef} onSubmit={handleOnSubmit}>
          <Input
            label="Username"
            icon={faUser}
            placeholder="Username"
            name="username"
            errorMessage={usernameError}
            required
          />
          <br />
          <Input
            type="email"
            label="Email"
            icon={faEnvelope}
            placeholder="Email"
            name="email"
            errorMessage={emailError}
            required
          />
          <br />
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
          <br />
          <Input
            type="password"
            label="Password Confrimation"
            icon={faKey}
            placeholder="Password Confirmation"
            name="password-confirmation"
            errorMessage={passwordConfirmationError}
            required
          />
          <br />
          <br />
          <Button>Sign up</Button>
          <br />
          <div className="flex gap-2">
            <P>Already have an account?</P>
            <Link to="/login">Log in instead</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
