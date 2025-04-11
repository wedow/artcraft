import { useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSignalEffect } from "@preact/signals-react/runtime";

import { faKey, faUser } from "@fortawesome/pro-solid-svg-icons";
import { Button, Input, LoadingSpinner } from "~/components/ui";
import { authentication } from "~/signals";

import { paperWrapperStyles } from "~/components/styles";
import { twMerge } from "tailwind-merge";

export const Login = () => {
  const {
    signals: { status: authStatus },
    fetchers: { login },
    enums: { AUTH_STATUS },
  } = authentication;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement | null>(null);

  const authLoaderMessage = getAuthLoaderMessage();
  const shouldShowLoader = checkShouldShowLoader();
  function checkShouldShowLoader() {
    return (
      authStatus.value === AUTH_STATUS.LOGGING ||
      authStatus.value === AUTH_STATUS.LOGGED_IN ||
      authStatus.value === AUTH_STATUS.GET_USER_INFO
    );
  }
  function getAuthLoaderMessage() {
    if (authStatus.value === AUTH_STATUS.LOGGED_IN) {
      return "Authenticated, Redirecting...";
    }
    if (authStatus.value === AUTH_STATUS.GET_USER_INFO) {
      return "Getting User Info...";
    }
    return "Getting Session...";
  }

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
    <div className="fixed flex h-full w-full flex-col items-center justify-center bg-[url('/svg/bg-dots.svg')] bg-[length:200px_200px] bg-center bg-repeat">
      <div className="my-7 flex w-10/12 max-w-2xl items-center justify-center gap-4">
        <img
          src="/brand/Storyteller-Logo-Black.png"
          alt="Storyteller Logo"
          className="h-11 select-none"
        />
      </div>
      <div className="w-full max-w-xl rounded-xl shadow-lg">
        <div
          className={twMerge(
            paperWrapperStyles,
            "relative mx-auto w-full rounded-none rounded-t-xl p-8 shadow-none",
          )}
        >
          <h1 className="mb-9 text-center text-2xl font-bold">
            Log in to Board
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

            <Button className="mt-6 py-3">Continue</Button>
          </form>
          {shouldShowLoader && (
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
              <LoadingSpinner isShowing={true} message={authLoaderMessage} />
            </div>
          )}
        </div>
        <div className="align-items flex w-full max-w-xl rounded-b-xl border border-t-0 bg-gray-100 px-8 py-4">
          <a
            href="https://storyteller.ai/password-reset"
            className="text-brand-primary hover:text-brand-primary-400 grow text-sm transition-all duration-150"
          >
            Forgot your password?
          </a>
          <div className="flex justify-end gap-1 text-sm">
            <p className="opacity-75">Don&apos;t have an account?</p>
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
