import React, { useContext, useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import {
  CreateSession,
  CreateSessionIsError,
  CreateSessionIsSuccess,
} from "@storyteller/components/src/api/session/CreateSession";
import { GoogleCreateAccount } from "@storyteller/components/src/api/sso/GoogleCreateAccount";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faKey } from "@fortawesome/free-solid-svg-icons";
import { Analytics } from "../../../../common/Analytics";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import Panel from "components/common/Panel";
import ScrollingSceneCarousel from "../landing/storyteller/PostlaunchLanding/ScrollingSceneCarousel";
import { GOOGLE_AUTH_SIGN_IN_SCRIPT, InjectScript } from "common/InjectScript";
import { AppStateContext } from "components/providers/AppStateProvider";
import {
  GetWebsite,
  Website,
} from "@storyteller/components/src/env/GetWebsite";
import GoogleSSO from "components/common/GoogleSSO";
import { useModal } from "hooks";
import SetUsernameModal from "../signup/SetUsernameModal";
import { isVideoToolsEnabled } from "config/featureFlags";

export default function LoginPage() {
  let history = useHistory();
  const { open } = useModal();
  const domain = GetWebsite();
  const { sessionWrapper, queryAppState } = useContext(AppStateContext);
  const [password, setPassword] = useState("");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  let location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get("redirect") || "/";

  const openModal = () => {
    open({
      component: SetUsernameModal,
      width: "small",
      lockTint: true,
    });
  };

  if (sessionWrapper.isLoggedIn()) {
    history.push("/");
  }

  PosthogClient.recordPageview();
  //InjectMetaTag.addGoogleSignInClientId();
  usePrefixedDocumentTitle("Log in to your account");

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

  const handleUsernameOrEmailChange = (
    ev: React.FormEvent<HTMLInputElement>
  ) => {
    ev.preventDefault();
    const usernameOrEmailValue = (ev.target as HTMLInputElement).value;
    setUsernameOrEmail(usernameOrEmailValue);
    setErrorMessage("");
    return false;
  };

  const handlePasswordChange = (ev: React.FormEvent<HTMLInputElement>) => {
    ev.preventDefault();
    const passwordValue = (ev.target as HTMLInputElement).value;
    setPassword(passwordValue);
    setErrorMessage("");
    return false;
  };

  const handleFormSubmit = async (
    ev: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> => {
    ev.preventDefault();

    const request = {
      username_or_email: usernameOrEmail,
      password: password,
    };

    Analytics.accountLoginAttempt();

    const response = await CreateSession("", request, {});

    if (CreateSessionIsError(response)) {
      setErrorMessage(response.error_message);
    } else if (CreateSessionIsSuccess(response)) {
      queryAppState();
      Analytics.accountLoginSuccess();
      history.push(redirectUrl);
    }

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

  let errorWarning = <span />;
  if (errorMessage) {
    errorWarning = (
      <div className="alert alert-danger mb-4">
        <strong>Login Error:</strong> {errorMessage}
      </div>
    );
  }

  const betaKeyRedirect = redirectUrl?.includes("/beta-key/redeem");
  // const { open } = useModal();
  // const openModal = () =>
  //   open({
  //     component: EmailSignUp,
  //     props: { mobile: true, showHanashi: false, handleClose: openModal },
  //   });

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
                    Log in and use our AI video tools!
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
              ? "Login to Redeem Beta Key"
              : `Login to ${domain.titlePart}`}
          </h2>

          <Panel padding={true} className="login-panel rounded">
            {errorWarning}

            <form onSubmit={handleFormSubmit}>
              <div className="d-flex flex-column gap-3">
                <div>
                  <label className="sub-title">Username or Email</label>
                  <div className="form-group input-icon">
                    <span className="form-control-feedback">
                      <FontAwesomeIcon icon={faUser} />
                    </span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Username or Email"
                      value={usernameOrEmail}
                      onChange={handleUsernameOrEmailChange}
                    />
                  </div>
                  {/*<p className="help"></p>*/}
                </div>

                <div>
                  <label className="sub-title">Password</label>
                  <div className="form-group input-icon">
                    <span className="form-control-feedback">
                      <FontAwesomeIcon icon={faKey} />
                    </span>
                    <input
                      className="form-control"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  <p className="d-flex flex-lg-row gap-2">
                    <Link
                      to="/password-reset"
                      className="text-link form-text flex-grow-1"
                    >
                      Forgot your password?
                    </Link>
                    <span className="form-text text-link">
                      <div className="d-flex gap-1">
                        <div className="d-block d-xxl-none">No account? </div>
                        <div className="d-none d-xxl-block">
                          Don't have an account?
                        </div>
                        <Link to={`/signup${location.search}`}>Sign up</Link>
                      </div>
                    </span>
                  </p>
                </div>
              </div>
              <button className="btn btn-primary w-100 mt-4">Login</button>
              <GoogleSSO mode="login" />
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
