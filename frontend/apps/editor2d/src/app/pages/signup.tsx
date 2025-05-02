import { useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { faKey, faUser } from "@fortawesome/pro-solid-svg-icons";
import { Button, Input, LoadingSpinner } from "~/components/ui";
import { authentication } from "~/signals";
import { twMerge } from "tailwind-merge";

export const Signup = () => {
  const {
    signals: { status: authStatus },
    fetchers: { signUp },
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
      return "Account Created, Redirecting...";
    }
    if (authStatus.value === AUTH_STATUS.GET_USER_INFO) {
      return "Getting User Info...";
    }
    return "Creating Account...";
  }

  const handleOnSumbit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (formRef.current) {
      const form = new FormData(formRef.current);
      const username = form.get("username")?.toString();
      const email = form.get("email")?.toString();
      const password = form.get("password")?.toString();
      const confirmPassword = form.get("confirmPassword")?.toString();

      if (!username || !email || !password || !confirmPassword) {
        alert("All fields are required");
        return;
      }

      if (password !== confirmPassword) {
        alert("Passwords don't match");
        return;
      }

      signUp({
        username,
        email,
        password,
        passwordConfirmation: confirmPassword,
      });
    }
  };

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
          <h1 className="mb-6 text-center text-2xl font-bold">
            Create your Account
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
              label="Username"
              icon={faUser}
              name="username"
              placeholder="Username"
              autoComplete="username"
              required
            />
            <Input
              label="Email"
              icon={faUser}
              name="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              icon={faKey}
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm Password"
              icon={faKey}
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              autoComplete="new-password"
              required
            />

            <Button className="mt-4 py-3">Create Account</Button>
          </form>
          {shouldShowLoader && (
            <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
              <LoadingSpinner isShowing={true} message={authLoaderMessage} />
            </div>
          )}
        </div>
        <div className="align-items flex w-full max-w-xl rounded-b-xl bg-ui-controls px-6 py-4">
          <div className="flex w-full justify-end gap-1 text-sm">
            <p className="opacity-75">Already have an account?</p>
            <Link to="/login">Log In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
