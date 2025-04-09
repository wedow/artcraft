import React, { useContext, useEffect, useState } from "react";
import { t } from "i18next";
import { Trans } from "react-i18next";
import {
  CreateAccount,
  CreateAccountIsError,
  CreateAccountIsSuccess,
} from "@storyteller/components/src/api/user/CreateAccount";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Analytics } from "../../../../common/Analytics";
import queryString from "query-string";
import { WebUrl } from "../../../../common/WebUrl";
import { BeginStripeCheckoutFlow } from "../../../../common/BeginStripeCheckoutFlow";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import Panel from "components/common/Panel";
import ScrollingSceneCarousel from "../landing/storyteller/PostlaunchLanding/ScrollingSceneCarousel";
import { AppStateContext } from "components/providers/AppStateProvider";
import {
  GetWebsite,
  Website,
} from "@storyteller/components/src/env/GetWebsite";
import { GoogleCreateAccount } from "@storyteller/components/src/api/sso/GoogleCreateAccount";
import GoogleSSO from "components/common/GoogleSSO";
import { GOOGLE_AUTH_SIGN_IN_SCRIPT, InjectScript } from "common/InjectScript";
import { Button } from "components/common";
import SetUsernameModal from "./SetUsernameModal";
import { useModal } from "hooks";
import { isVideoToolsEnabled } from "config/featureFlags";

enum FieldTriState {
  EMPTY_FALSE,
  FALSE,
  TRUE,
}

export default function SignupPage() {
  let history = useHistory();
  const domain = GetWebsite();
  const { open } = useModal();
  let location = useLocation();
  const { sessionWrapper, queryAppState } = useContext(AppStateContext);
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get("redirect") || "/";

  const parsedQueryString = queryString.parse(window.location.search);

  const [username, setUsername] = useState("");
  const [usernameValid, setUsernameValid] = useState(FieldTriState.EMPTY_FALSE);
  const [usernameInvalidReason, setUsernameInvalidReason] = useState("");

  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(FieldTriState.EMPTY_FALSE);
  const [emailInvalidReason, setEmailInvalidReason] = useState("");

  const [password, setPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState(FieldTriState.EMPTY_FALSE);
  const [passwordInvalidReason, setPasswordInvalidReason] = useState("");

  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordConfirmationValid, setPasswordConfirmationValid] = useState(
    FieldTriState.EMPTY_FALSE
  );
  const [
    passwordConfirmationInvalidReason,
    setPasswordConfirmationInvalidReason,
  ] = useState("");

  const openModal = () => {
    open({
      component: SetUsernameModal,
      width: "small",
      lockTint: true,
    });
  };

  // Hack to make the Google Button load in properly
  useEffect(() => {
    InjectScript.addGoogleAuthLogin();

    return () => {
      const existingScript = document.querySelector(
        `script[src="${GOOGLE_AUTH_SIGN_IN_SCRIPT}"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const handleUsernameChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();
    PosthogClient.recordPageview();

    const newUsername = (ev.target as HTMLInputElement).value;

    let usernameValid = FieldTriState.EMPTY_FALSE;
    let usernameInvalidReason = "";

    if (newUsername.length > 1) {
      if (newUsername.length < 3) {
        usernameValid = FieldTriState.FALSE;
        usernameInvalidReason = t("account.SignUpPage.errors.usernameTooShort");
      } else if (newUsername.length > 15) {
        usernameValid = FieldTriState.FALSE;
        usernameInvalidReason = t("account.SignUpPage.errors.usernameTooLong");
      } else {
        usernameValid = FieldTriState.TRUE;
      }
    }

    setUsername(newUsername);
    setUsernameValid(usernameValid);
    setUsernameInvalidReason(usernameInvalidReason);

    return false;
  };

  // This function ***MUST*** be attached to global state for the Google library to work.
  // @ts-ignore
  globalThis.handleGoogleCredentialResponse = async (args: any) => {
    // console.log(">>>> Google Sign In Response", args);

    let response = await GoogleCreateAccount({
      google_credential: args.credential,
    });

    if (response.success) {
      queryAppState();

      if (response.username_not_yet_customized === true) {
        openModal();
      }

      history.push(redirectUrl);
    } else {
      console.error("Google account creation failed");
    }
  };

  const handleEmailChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();

    const newEmail = (ev.target as HTMLInputElement).value;

    let emailValid = FieldTriState.EMPTY_FALSE;
    let emailInvalidReason = "";

    if (newEmail.length > 1) {
      if (newEmail.length < 3) {
        emailValid = FieldTriState.FALSE;
        emailInvalidReason = t("account.SignUpPage.errors.emailTooShort");
      } else if (!newEmail.includes("@")) {
        emailValid = FieldTriState.FALSE;
        emailInvalidReason = t("account.SignUpPage.errors.emailInvalid");
      } else {
        emailValid = FieldTriState.TRUE;
      }
    }

    setEmail(newEmail);
    setEmailValid(emailValid);
    setEmailInvalidReason(emailInvalidReason);

    return false;
  };

  const handlePasswordChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();

    const newPassword = (ev.target as HTMLInputElement).value;

    let passwordValid = FieldTriState.EMPTY_FALSE;
    let passwordInvalidReason = "";
    let passwordConfirmationValid = FieldTriState.EMPTY_FALSE;
    let passwordConfirmationInvalidReason = "";

    if (newPassword.length > 1) {
      if (newPassword.length < 6) {
        passwordValid = FieldTriState.FALSE;
        passwordInvalidReason = t("account.SignUpPage.errors.passwordTooShort");
      } else {
        passwordValid = FieldTriState.TRUE;
      }

      if (newPassword !== passwordConfirmation) {
        passwordConfirmationValid = FieldTriState.FALSE;
        passwordConfirmationInvalidReason = t(
          "account.SignUpPage.errors.passwordsDoNotMatch"
        );
      } else {
        passwordConfirmationValid = FieldTriState.TRUE;
        passwordConfirmationInvalidReason = "";
      }
    }

    setPassword(newPassword);
    setPasswordValid(passwordValid);
    setPasswordInvalidReason(passwordInvalidReason);
    setPasswordConfirmationValid(passwordConfirmationValid);
    setPasswordConfirmationInvalidReason(passwordConfirmationInvalidReason);

    return false;
  };

  const handlePasswordConfirmationChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    ev.preventDefault();

    const newPasswordConfirmation = (ev.target as HTMLInputElement).value;

    let passwordConfirmationValid = FieldTriState.EMPTY_FALSE;
    let passwordConfirmationInvalidReason = "";

    if (newPasswordConfirmation.length > 1) {
      if (newPasswordConfirmation !== password) {
        passwordConfirmationValid = FieldTriState.FALSE;
        passwordConfirmationInvalidReason = t(
          "account.SignUpPage.errors.passwordsDoNotMatch"
        );
      } else {
        passwordConfirmationValid = FieldTriState.TRUE;
        passwordConfirmationInvalidReason = "";
      }
    }

    setPasswordConfirmation(newPasswordConfirmation);
    setPasswordConfirmationValid(passwordConfirmationValid);
    setPasswordConfirmationInvalidReason(passwordConfirmationInvalidReason);

    return false;
  };

  const handleFormSubmit = async (
    ev: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    Analytics.accountSignupAttempt();

    if (
      usernameValid !== FieldTriState.TRUE ||
      emailValid !== FieldTriState.TRUE ||
      passwordValid !== FieldTriState.TRUE ||
      passwordConfirmationValid !== FieldTriState.TRUE
    ) {
      return false;
    }

    const request = {
      username: username,
      email_address: email,
      password: password,
      password_confirmation: passwordConfirmation,
    };

    const response = await CreateAccount("", request, {});

    if (CreateAccountIsError(response)) {
      if ("email_address" in response.error_fields) {
        let reason = response.error_fields["email_address"] || "";
        // NB: Hacky translation of serverside error strings.
        switch (reason) {
          case "email is invalid":
            reason = t("account.SignUpPage.errors.emailInvalid");
            break;
        }
        setEmailValid(FieldTriState.FALSE);
        setEmailInvalidReason(reason);
      }
      if ("username" in response.error_fields) {
        let reason = response.error_fields["username"] || "";
        setUsernameValid(FieldTriState.FALSE);
        // NB: Hacky translation of serverside error strings.
        switch (reason) {
          case "invalid username characters":
            reason = t("account.SignUpPage.errors.usernameInvalidCharacters");
            break;
          case "username is too long":
            // NB: If the frontend doesn't catch it, the server will
            reason = t("account.SignUpPage.errors.usernameTooLong");
            break;
          case "username is taken":
            reason = t("account.SignUpPage.errors.usernameIsTaken");
            break;
          case "username is reserved":
            reason = t("account.SignUpPage.errors.usernameIsReserved");
            break;
          case "username contains slurs":
            reason = t("account.SignUpPage.errors.usernameIsSlur");
            break;
        }

        setUsernameInvalidReason(reason);
      }
    } else if (CreateAccountIsSuccess(response)) {
      queryAppState();

      Analytics.accountSignupComplete();

      let redirectWasSuccessful = await afterSignupRedirect();
      if (!redirectWasSuccessful) {
        window.location.href = WebUrl.pricingPageWithReferer("signup");
      }
    }

    return false;
  };

  let redirectLink = queryParams.get("redirect");
  const redirectSignUpLink = "/welcome";

  const afterSignupRedirect = async () => {
    const maybeInternalPlanKey = parsedQueryString["sub"] as string | undefined;

    if (domain.website === Website.FakeYou) {
      if (maybeInternalPlanKey !== undefined) {
        return await BeginStripeCheckoutFlow(maybeInternalPlanKey);
      }
    }

    let redirectUrl = redirectLink
      ? redirectLink.includes("?")
        ? redirectLink + "&from=signup"
        : redirectLink + "?from=signup"
      : // : "/";
        WebUrl.pricingPageWithReferer("signup");

    if (domain.website === Website.StorytellerAi) {
      redirectUrl = redirectSignUpLink;
      if (redirectUrl === redirectSignUpLink) {
        sessionStorage.setItem("redirected", "true");
      }
    }
    history.push(redirectUrl);

    return true;
  };

  const betaKeyRedirect = redirectLink?.includes("/beta-key/redeem");
  // const { open } = useModal();
  // const openModal = () =>
  //   open({
  //     component: EmailSignUp,
  //     props: { mobile: true, showHanashi: false, handleClose: openModal },
  //   });

  usePrefixedDocumentTitle("Create an account");

  if (sessionWrapper.isLoggedIn()) {
    return (
      <div className="container py-5">
        <div className="py-5">
          <h1 className="fw-semibold text-center mb-4">
            Invalid view for logged in users.
          </h1>
          <div className="text-center">
            <Link className="btn btn-primary" to="/">
              {t("account.SignUpPage.backToMainLink")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let usernameInputClass = "form-control";
  let usernameHelpClass = "form-text red";
  switch (usernameValid) {
    case FieldTriState.EMPTY_FALSE:
      break;
    case FieldTriState.FALSE:
      usernameInputClass += " is-danger";
      usernameHelpClass += " is-danger";
      break;
    case FieldTriState.TRUE:
      usernameInputClass += " is-success";
      usernameHelpClass += " is-success";
      break;
  }

  let emailInputClass = "form-control";
  let emailHelpClass = "form-text red";
  switch (emailValid) {
    case FieldTriState.EMPTY_FALSE:
      break;
    case FieldTriState.FALSE:
      emailInputClass += " is-danger";
      emailHelpClass += " is-danger";
      break;
    case FieldTriState.TRUE:
      emailInputClass += " is-success";
      emailHelpClass += " is-success";
      break;
  }

  let passwordInputClass = "form-control";
  let passwordHelpClass = "form-text red";
  switch (passwordValid) {
    case FieldTriState.EMPTY_FALSE:
      break;
    case FieldTriState.FALSE:
      passwordInputClass += " is-danger";
      passwordHelpClass += " is-danger";
      break;
    case FieldTriState.TRUE:
      passwordInputClass += " is-success";
      passwordHelpClass += " is-success";
      break;
  }

  let passwordConfirmationInputClass = "form-control";
  let passwordConfirmationHelpClass = "form-text red";
  switch (passwordConfirmationValid) {
    case FieldTriState.EMPTY_FALSE:
      break;
    case FieldTriState.FALSE:
      passwordConfirmationInputClass += " is-danger";
      passwordConfirmationHelpClass += " is-danger";
      break;
    case FieldTriState.TRUE:
      passwordConfirmationInputClass += " is-success";
      passwordConfirmationHelpClass += " is-success";
      break;
  }

  return (
    <div className="overflow-hidden auth-page-left">
      <div className="row h-100 g-0">
        {isVideoToolsEnabled() ? (
          <>
            <div className="col-12 col-lg-6 col-xl-7 bg-panel d-flex flex-column align-items-center justify-content-center order-2 order-lg-1 p-5 p-lg-0">
              {domain.website === Website.StorytellerAi ? (
                <>
                  <a
                    href="https://storyteller.ai"
                    style={{ marginBottom: "20px" }}
                  >
                    <img
                      src="/fakeyou/Storyteller-Logo-1.png"
                      alt="Storyteller Logo"
                      style={{ maxWidth: "280px" }}
                    />
                  </a>
                  <p className="fw-medium fs-5 text-center">
                    Check out what our new AI creation engine can make!
                  </p>
                  <div className="w-100 d-none d-lg-block">
                    <ScrollingSceneCarousel gradientColor="#262636" />
                  </div>
                  <div className="w-100 d-block d-lg-none">
                    <ScrollingSceneCarousel
                      gradientColor="#262636"
                      small={true}
                    />
                  </div>
                </>
              ) : (
                <>
                  <a
                    href="https://fakeyou.com"
                    style={{ marginBottom: "20px" }}
                  >
                    <img
                      src="/fakeyou/FakeYou-Logo-2.png"
                      alt="FakeYou Logo"
                      style={{ maxWidth: "200px" }}
                    />
                  </a>
                  <p className="fw-medium fs-5 text-center">
                    Sign up and use our AI video tools!
                  </p>
                  <div className="mt-5 mx-5 px-xl-5 w-100">
                    <div className="row g-5">
                      <div className="col-12 col-lg-4">
                        <div className="px-lg-3">
                          <div
                            style={{
                              aspectRatio: "4/3",
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              borderRadius: "0.5rem",
                              overflow: "hidden",
                            }}
                          >
                            <video
                              autoPlay
                              playsInline
                              muted
                              loop
                              className="object-fit-cover w-100 h-100"
                            >
                              <source src="/videos/ai-tools/vst_video.mp4" />
                            </video>
                          </div>
                          <h4 className="fw-bold mt-3 text-center">
                            Video Style Transfer
                          </h4>
                        </div>
                      </div>
                      <div className="col-12 col-lg-4">
                        <div className="px-lg-3">
                          <div
                            style={{
                              aspectRatio: "4/3",
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              borderRadius: "0.5rem",
                              overflow: "hidden",
                            }}
                          >
                            <video
                              autoPlay
                              playsInline
                              muted
                              loop
                              className="object-fit-cover w-100 h-100"
                            >
                              <source src="/videos/ai-tools/lp_video.mp4" />
                            </video>
                          </div>
                          <h4 className="fw-bold mt-3 text-center">
                            Live Portrait
                          </h4>
                        </div>
                      </div>
                      <div className="col-12 col-lg-4">
                        <div className="px-lg-3">
                          <div
                            style={{
                              aspectRatio: "4/3",
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              borderRadius: "0.5rem",
                              overflow: "hidden",
                            }}
                          >
                            <video
                              autoPlay
                              playsInline
                              muted
                              loop
                              className="object-fit-cover w-100 h-100"
                            >
                              <source src="/videos/ai-tools/ls_video.mp4" />
                            </video>
                          </div>
                          <h4 className="fw-bold mt-3 text-center">Lipsync</h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* {!betaKeyRedirect && (
            <p className="fs-7 mt-5">
              Interested? Join the
              <span
                onClick={openModal}
                className="text-red"
                style={{ cursor: "pointer" }}
              >
                {" "}
                waitlist
              </span>{" "}
              now!
            </p>
          )} */}
            </div>
          </>
        ) : null}
        <div
          className={`col-12 d-flex flex-column justify-content-center align-items-center  order-lg-2 order-1 auth-page-right ${
            isVideoToolsEnabled()
              ? "col-lg-6 col-xl-5 align-items-lg-start"
              : ""
          }`}
        >
          <h2 className="fw-bold mb-0 mt-5 mb-4">
            {betaKeyRedirect
              ? "Sign Up to Redeem Beta Key"
              : `Sign Up for ${domain.titlePart}`}
          </h2>

          <Panel padding={true} className="login-panel rounded">
            <form onSubmit={handleFormSubmit}>
              <div className="d-flex flex-column gap-2">
                <div>
                  <label className="sub-title">
                    {t("account.SignUpPage.inputs.username")}
                  </label>
                  <div className="form-group input-icon">
                    <span className="form-control-feedback">
                      <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                      className={usernameInputClass}
                      type="text"
                      placeholder={t(
                        "account.SignUpPage.inputs.usernamePlaceholder"
                      )}
                      value={username}
                      onChange={handleUsernameChange}
                    />
                  </div>
                  <p className={usernameHelpClass}>{usernameInvalidReason}</p>
                </div>
                <div>
                  <label className="sub-title">
                    {t("account.SignUpPage.inputs.email")}
                  </label>
                  <div className="form-group input-icon">
                    <span className="form-control-feedback">
                      <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <input
                      className={emailInputClass}
                      type="email"
                      placeholder={t(
                        "account.SignUpPage.inputs.emailPlaceholder"
                      )}
                      value={email}
                      onChange={handleEmailChange}
                    />
                  </div>
                  <p className={emailHelpClass}>{emailInvalidReason}</p>
                </div>
                <div>
                  <label className="sub-title">
                    {t("account.SignUpPage.inputs.password")}
                  </label>
                  <div className="form-group input-icon">
                    <span className="form-control-feedback">
                      <FontAwesomeIcon icon={faKey} />
                    </span>
                    <input
                      className={passwordInputClass}
                      type="password"
                      placeholder={t(
                        "account.SignUpPage.inputs.passwordPlaceholder"
                      )}
                      value={password}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <p className={passwordHelpClass}>{passwordInvalidReason}</p>
                </div>
                <div>
                  <label className="sub-title">
                    {t("account.SignUpPage.inputs.passwordConfirm")}
                  </label>
                  <div className="form-group input-icon">
                    <span className="form-control-feedback">
                      <FontAwesomeIcon icon={faKey} />
                    </span>
                    <input
                      className={passwordConfirmationInputClass}
                      type="password"
                      placeholder={t(
                        "account.SignUpPage.inputs.passwordConfirmPlaceholder"
                      )}
                      value={passwordConfirmation}
                      onChange={handlePasswordConfirmationChange}
                    />
                  </div>
                  <p className={passwordConfirmationHelpClass}>
                    {passwordConfirmationInvalidReason}
                  </p>
                </div>
                {/*<div className="alert alert-warning mb-0">
                <strong>Remember your password!</strong> We don't have
                password reset currently, and it'll be a few more weeks before
                it's added (there are more important features to work on). If
                you lose your password, please let us know in Discord.
              </div>*/}
                <div>
                  <Button
                    label={t("account.SignUpPage.signUpButton")}
                    className="btn btn-primary btn-lg w-100 mt-2 mb-0"
                    onClick={handleFormSubmit}
                  />
                  <GoogleSSO mode="signup" />
                </div>
                <p className="fs-7 mt-2">
                  <Trans i18nKey="account.SignUpPage.signInInstead">
                    Already have an account?{" "}
                    <Link to={`/login${location.search}`}>Log in instead.</Link>
                  </Trans>
                </p>
              </div>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
