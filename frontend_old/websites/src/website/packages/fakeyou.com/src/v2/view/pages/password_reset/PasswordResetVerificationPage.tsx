import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import Container from "components/common/Container";
import PageHeader from "components/layout/PageHeader";
import Input from "components/common/Input";
import { Button } from "components/common";
import Panel from "components/common/Panel";
import { faLock } from "@fortawesome/pro-solid-svg-icons";
import {
  RedeemResetPassword,
  RedeemResetPasswordIsSuccess,
} from "@storyteller/components/src/api/user/RedeemResetPassword";
import { AppStateContext } from "components/providers/AppStateProvider";

// TODO(bt,2023-11-12): Localize error messages
const ERR_CODE_NOT_SET = "password reset code is not set";
const ERR_CODE_TOO_SHORT = "password reset code is too short";
const ERR_PASSWORD_TOO_SHORT = "new password is too short";
const ERR_PASSWORD_DOES_NOT_MATCH = "new password does not match";
const ERR_BACKEND =
  "There was an issue resetting your password. Perhaps your code expired?";

export default function PasswordResetVerificationPage() {
  const history = useHistory();
  const { sessionWrapper, queryAppState } = useContext(AppStateContext);

  usePrefixedDocumentTitle("Password Reset Verification");

  const [resetToken, setResetToken] = useState(getCodeFromUrl() || "");
  const [resetTokenLooksValid, setResetTokenLooksValid] = useState(
    !!!getResetCodeErrors(getCodeFromUrl())
  );
  const [resetTokenInvalidReason, setResetTokenInvalidReason] = useState(
    getResetCodeErrors(getCodeFromUrl())
  );

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordIsValid, setNewPasswordIsValid] = useState(false);
  const [newPasswordInvalidReason, setNewPasswordInvalidReason] = useState<
    string | undefined
  >(ERR_PASSWORD_TOO_SHORT);

  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [newPasswordConfirmationIsValid, setNewPasswordConfirmationIsValid] =
    useState(false);
  const [
    newPasswordConfirmationInvalidReason,
    setNewPasswordConfirmationInvalidReason,
  ] = useState<string | undefined>(ERR_PASSWORD_TOO_SHORT);

  const [backendError, setBackendError] = useState<string | undefined>(
    undefined
  );

  if (sessionWrapper.isLoggedIn()) {
    history.push("/");
  }

  const handleChangeResetToken = (ev: React.FormEvent<HTMLInputElement>) => {
    const token = (ev.target as HTMLInputElement).value;
    const errors = getResetCodeErrors(token);
    setResetToken(token);
    setResetTokenLooksValid(!!!errors);
    setResetTokenInvalidReason(errors);
  };

  const handleChangePassword = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value;

    let isValid = true;
    let invalidReason = undefined;

    if (value.length < 5) {
      isValid = false;
      invalidReason = ERR_PASSWORD_TOO_SHORT;
    }

    setNewPassword(value);
    setNewPasswordIsValid(isValid);
    setNewPasswordInvalidReason(invalidReason);

    if (value !== newPasswordConfirmation) {
      setNewPasswordConfirmationIsValid(false);
      setNewPasswordConfirmationInvalidReason(ERR_PASSWORD_DOES_NOT_MATCH);
    } else if (newPasswordConfirmation.length > 4) {
      setNewPasswordConfirmationIsValid(true);
      setNewPasswordConfirmationInvalidReason(undefined);
    }
  };

  const handleChangePasswordConfirmation = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    const value = (ev.target as HTMLInputElement).value;

    let isValid = true;
    let invalidReason = undefined;

    if (value !== newPassword) {
      isValid = false;
      invalidReason = ERR_PASSWORD_DOES_NOT_MATCH;
    } else if (value.length < 5) {
      isValid = false;
      invalidReason = ERR_PASSWORD_TOO_SHORT;
    }

    setNewPasswordConfirmation(value);
    setNewPasswordConfirmationIsValid(isValid);
    setNewPasswordConfirmationInvalidReason(invalidReason);
  };

  const handleSubmit = async (
    ev: React.FormEvent<HTMLButtonElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    const password = newPassword.trim();
    const passwordConfirmation = newPasswordConfirmation.trim();

    const request = {
      reset_token: resetToken,
      new_password: password,
      new_password_validation: passwordConfirmation,
    };

    const response = await RedeemResetPassword(request);

    // TODO(bt,2023-11-12): Handle server-side errors

    if (RedeemResetPasswordIsSuccess(response)) {
      setBackendError(undefined);
      queryAppState();
      history.push("/");
    } else {
      setBackendError(ERR_BACKEND);
    }

    return false;
  };

  const canSubmit =
    resetTokenLooksValid &&
    newPasswordIsValid &&
    newPasswordConfirmationIsValid;

  let resetTokenHelpClasses = resetTokenLooksValid
    ? ""
    : "form-control is-danger";
  let newPasswordHelpClasses = newPasswordIsValid
    ? ""
    : "form-control is-danger";
  let newPasswordConfirmationHelpClasses = newPasswordConfirmationIsValid
    ? ""
    : "form-control is-danger";
  let backendErrorClasses = !!!backendError ? "" : "form-control is-danger";

  return (
    <Container type="panel" className="login-panel">
      <PageHeader
        title="Password Reset Verification"
        subText="Enter the code sent to your email address."
        panel={false}
      />

      <Panel padding={true}>
        <form>
          <div className="d-flex flex-column gap-4">
            <Input
              label="Verification Code"
              icon={faLock}
              placeholder="Enter verification code"
              value={resetToken}
              onChange={handleChangeResetToken}
            />

            <p className={resetTokenHelpClasses}>{resetTokenInvalidReason}</p>

            <Input
              type="password"
              label="New Password"
              icon={faLock}
              placeholder="Enter new password"
              value={newPassword}
              onChange={handleChangePassword}
            />

            <p className={newPasswordHelpClasses}>{newPasswordInvalidReason}</p>

            <Input
              type="password"
              label="Verify New Password"
              icon={faLock}
              placeholder="Enter new password again"
              value={newPasswordConfirmation}
              onChange={handleChangePasswordConfirmation}
            />

            <p className={newPasswordConfirmationHelpClasses}>
              {newPasswordConfirmationInvalidReason}
            </p>

            <p className={backendErrorClasses}>{backendError}</p>

            <Button
              label="Change Password"
              onClick={handleSubmit}
              disabled={!canSubmit}
            />
          </div>
        </form>
      </Panel>
    </Container>
  );
}

// Pre-load the code from a URL query string, eg https://fakeyou.com/password-reset/validate?code=codeGoesHere
function getCodeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenUnsafe = urlParams.get("token");
  const tokenSafe =
    tokenUnsafe === null ? null : tokenUnsafe.replace(/[^A-Za-z0-9]/g, "");
  return tokenSafe;
}

// Handle error state at initialization
function getResetCodeErrors(code: string | null): string | undefined {
  if (!code) {
    return ERR_CODE_NOT_SET;
  }
  if (code.length < 10) {
    return ERR_CODE_TOO_SHORT;
  }
}
