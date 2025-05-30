import React, { useState, useEffect } from "react";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { faUser, faKey, faEnvelope } from "@fortawesome/pro-solid-svg-icons";

interface ArtCraftSignUpProps {
  onSubmit: (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => void;
  isSignUp: boolean;
  onToggleMode: () => void;
  formRef?: React.RefObject<HTMLFormElement | null>;
  errorMessage?: string;
}

export const ArtCraftSignUp = ({
  onSubmit,
  isSignUp,
  onToggleMode,
  formRef,
  errorMessage,
}: ArtCraftSignUpProps) => {
  const [localError, setLocalError] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLocalError(errorMessage);
  }, [errorMessage]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (isSignUp) {
      const username = (form.elements.namedItem("username") as HTMLInputElement)
        .value;
      const email = (form.elements.namedItem("email") as HTMLInputElement)
        .value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;
      const confirmPassword = (
        form.elements.namedItem("confirmPassword") as HTMLInputElement
      ).value;
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }
      onSubmit(username, email, password, confirmPassword);
    } else {
      const usernameOrEmail = (
        form.elements.namedItem("usernameOrEmail") as HTMLInputElement
      ).value;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;
      onSubmit(usernameOrEmail, "", password, "");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-3 text-center">
        {isSignUp ? "Sign up for ArtCraft" : "Log in to ArtCraft"}
      </h2>
      <form
        className="flex flex-col gap-3 w-full max-w-md"
        onSubmit={handleSubmit}
        ref={formRef}
      >
        {isSignUp ? (
          <>
            <Input
              label="Username"
              icon={faUser}
              name="username"
              placeholder="Username"
              required
              autoComplete="off"
            />
            <Input
              label="Email"
              icon={faEnvelope}
              name="email"
              type="email"
              placeholder="Email"
              required={isSignUp}
              style={isSignUp ? {} : { display: "none" }}
              autoComplete="off"
            />
          </>
        ) : (
          <Input
            label="Email or Username"
            icon={faUser}
            name="usernameOrEmail"
            placeholder="Email or Username"
            required
            autoComplete="off"
          />
        )}

        <Input
          label="Password"
          icon={faKey}
          type="password"
          name="password"
          placeholder="Password"
          required
          autoComplete="off"
        />
        {isSignUp && (
          <Input
            label="Confirm Password"
            icon={faKey}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            autoComplete="off"
          />
        )}
        <button type="submit" className="hidden" />
        <div className="relative mt-3">
          <div className="flex gap-2 items-center justify-center p-2 bg-white/5 rounded-lg">
            <p className="text-sm opacity-80">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            </p>
            <Button
              variant="secondary"
              className="p-0 bg-transparent hover:bg-transparent"
              type="button"
              onClick={onToggleMode}
            >
              <span className="text-sm text-primary-400 underline">
                {isSignUp ? "Log in" : "Sign up"}
              </span>
            </Button>
          </div>
          {localError && (
            <div className="absolute -bottom-10 left-0 right-0 text-red text-sm text-center mb-2 font-semibold">
              {localError}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
