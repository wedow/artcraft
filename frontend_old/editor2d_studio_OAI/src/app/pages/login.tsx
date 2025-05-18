import { useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { faKey, faUser } from "@fortawesome/pro-solid-svg-icons";
import { Button, Input, LoadingSpinner } from "~/components/ui";
import { authentication } from "~/signals";
import { twMerge } from "tailwind-merge";
import { UsersApi } from "@storyteller/api";

export const Login = () => {
  const {
    signals: { status: authStatus, userInfo },
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

  const handleOnSumbit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (formRef.current) {
      const form = new FormData(formRef.current);

      const usernameOrEmail = form.get("usernameOrEmail")?.toString();
      const password = form.get("password")?.toString();

      if (usernameOrEmail && password) {
        let api = new UsersApi();

        let response = await api.Login({
          usernameOrEmail,
          password,
        });

        if (response.success) {
          let session = response.data?.signedSession;
          if (session) {
            localStorage.setItem("session", session);
            authStatus.value = AUTH_STATUS.LOGGED_IN;
            let response = await api.GetUserProfile(usernameOrEmail);
            if (response.success) {
              userInfo.value = response.data?.user;
            }
          }
        }
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
    <div className="pegboard fixed flex h-full w-full flex-col items-center justify-center bg-center bg-repeat">
      <Button
        className="absolute left-4 top-4 px-3 py-2 text-sm"
        onClick={() => navigate("/")}
      >
        Back to Home
      </Button>
      <div className="mb-7 flex w-10/12 max-w-2xl items-center justify-center gap-4">
        <img
          src="/brand/artcraft-logo.png"
          alt="ArtCraft Logo"
          className="h-9 select-none"
        />
      </div>
      <div className="w-full max-w-xl rounded-xl shadow-lg">
        <div
          className={twMerge(
            "glass glass-no-hover relative mx-auto w-full rounded-none rounded-t-xl p-6 shadow-none",
          )}
        >
          <h1 className="mb-6 text-center text-2xl font-bold">Log in</h1>
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
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
              <LoadingSpinner isShowing={true} message={authLoaderMessage} />
            </div>
          )}
        </div>
        <div className="align-items flex w-full max-w-xl rounded-b-xl bg-ui-controls px-6 py-4">
          {/* <a
            href="https://storyteller.ai/password-reset"
            className="grow text-sm !text-primary-400 transition-all duration-150 hover:!text-primary-300"
          >
            Forgot your password?
          </a> */}
          <div className="flex justify-end gap-1 text-sm">
            <p className="opacity-75">Don&apos;t have an account?</p>
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
