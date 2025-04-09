import { Button, Container, Label, Panel, TempInput } from "components/common";
import React, { useEffect, useState } from "react";
import "./BetaKey.scss";
import { faArrowLeft, faKey } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RedeemBetaKey } from "@storyteller/components/src/api/beta_key/RedeemBetaKey";
import { Link, useHistory, useParams } from "react-router-dom";
import { useSession } from "hooks";
import LoadingSpinner from "components/common/LoadingSpinner";
import StorytellerStudioCTA from "components/common/StorytellerStudioCTA";
import { isMobile } from "react-device-detect";
import useModal from "hooks/useModal";
import EmailSignUp from "v2/view/pages/landing/storyteller/PostlaunchLanding/EmailSignUp";

export default function RedeemBetaKeyPage() {
  const { token: pageToken } = useParams<{ token: string }>();
  const [key, setKey] = useState(pageToken || "");
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const history = useHistory();
  const { loggedIn, sessionFetched } = useSession();

  useEffect(() => {
    if (sessionStorage.getItem("redirected") === "true") {
      sessionStorage.removeItem("redirected");
      window.location.reload();
    }
  }, [loggedIn]);

  const handleGoToSuccess = () => {
    history.push("/beta-key/redeem/success");
  };

  const { open } = useModal();
  const openModal = () =>
    open({
      component: EmailSignUp,
      props: { mobile: true, showHanashi: false, handleClose: openModal },
    });

  const handleRedeemBetaKey = async () => {
    try {
      setLoading(true);

      const response = await RedeemBetaKey("", {
        beta_key: key,
      });

      if (response.success) {
        handleGoToSuccess();
      } else {
        console.log("Failed to redeem beta key.");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Failed to redeem beta key.", error);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionFetched) {
    return (
      <Container type="panel" className="narrow-container">
        <div className="d-flex align-items-center justify-content-center vh-100 gap-4">
          <LoadingSpinner
            label="Loading"
            className="me-3 fs-6"
            labelClassName="fs-4"
          />
        </div>
      </Container>
    );
  }

  if (!loggedIn) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ minHeight: "100vh" }}
      >
        <Container
          type="panel"
          className="narrow-container d-flex flex-column align-items-center justify-content-center gap-4 mt-5"
        >
          <img
            src="/fakeyou/Storyteller-Logo-1.png"
            alt="Storyteller Logo"
            style={{ maxWidth: "280px" }}
          />
          <Panel padding={true}>
            <div className="d-flex flex-column align-items-center py-4">
              <h4 className="fw-bold mb-1 text-center">
                You need an account to redeem a beta key.
              </h4>
              <p className="opacity-75 text-center">
                Please login or create an account to proceed with redeeming a
                beta key.
              </p>
              <div className="d-flex gap-2 mt-2">
                <Button
                  label="Sign Up"
                  className="mt-3"
                  onClick={() => {
                    sessionStorage.setItem("redirected", "true");
                    const signUpPath = pageToken
                      ? `/signup?redirect=/beta-key/redeem/${pageToken}`
                      : "/signup?redirect=/beta-key/redeem/";
                    history.push(signUpPath);
                  }}
                />
                <Button
                  label="Login"
                  className="mt-3"
                  onClick={() => {
                    sessionStorage.setItem("redirected", "true");
                    const loginPath = pageToken
                      ? `/login?redirect=/beta-key/redeem/${pageToken}`
                      : "/login?redirect=/beta-key/redeem/";
                    history.push(loginPath);
                  }}
                  variant="secondary"
                />
              </div>
            </div>
          </Panel>
          <p className="fs-9 mt-5">
            Don't have a beta key? Join the
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
        </Container>

        {isMobile && (
          <Container type="panel" className="px-4">
            <div className="text-center mt-5 px-lg-5 d-flex flex-column">
              <span className="text-red fw-medium fs-5">Note: </span>
              <span className="opacity-75">
                Storyteller Studio is not optimized for mobile devices yet. You
                can redeem your beta key here first then access full features at{" "}
                <span className="text-red">Storyteller.ai</span> on a desktop
                computer after redemption.
              </span>
            </div>
          </Container>
        )}

        <Container type="panel" className="pt-lg-5">
          <div className="py-5">
            <StorytellerStudioCTA
              showButton={false}
              showMarquee={false}
              showIcon={false}
              title="Ready to Unlock Your Creativity?"
              subText="Make your story come alive. Simply build a scene and generate with a style you like. Sign up or log in now to redeem your beta key and start creating today!"
            />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <>
      <Container type="panel" className="redeem-container">
        <div className="d-flex flex-column align-items-center justify-content-center vh-100 gap-4">
          <div className="px-4 d-flex flex-column align-items-center">
            <img
              src="/fakeyou/Storyteller-Logo-1.png"
              alt="Storyteller Logo"
              className="mb-5 pb-3 pb-lg-5"
              style={{ maxWidth: "100%" }}
            />
            <div className="d-flex flex-column align-items-center">
              <h4 className="fw-bold mb-1 text-center">
                <FontAwesomeIcon icon={faKey} className="me-2 fs-5" />
                Redeem Studio Beta Key
              </h4>
              <p className="opacity-75 text-center">
                Enter your beta key to get access to Storyteller Studio Beta.
              </p>
            </div>
          </div>

          <Panel padding={true}>
            <div className="w-100 d-flex justify-content-center fs-5">
              <Label label="Enter your key:" />
            </div>

            <TempInput
              placeholder="Enter your beta key here..."
              value={key}
              onChange={e => {
                setKey(e.target.value);
                setShowAlert(false);
              }}
              required={true}
              className="text-center w-100 fs-5"
              autoFocus={true}
            />

            {showAlert && (
              <p className="text-center text-red">
                Invalid beta key! Please try again.
              </p>
            )}

            <div className="d-flex flex-column align-items-center">
              <Button
                label="Redeem Beta Key"
                className="redeem-button mt-3"
                onClick={handleRedeemBetaKey}
                isLoading={loading}
                disabled={key.length === 0}
              />
            </div>
          </Panel>
          {/* <p className="fs-9 mt-3">
            Don't have a beta key? Join the
            <span
              onClick={openModal}
              className="text-red"
              style={{ cursor: "pointer" }}
            >
              {" "}
              waitlist
            </span>{" "}
            now!
          </p> */}
          <p>
            <Link to="/">
              <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
              Back Home
            </Link>
          </p>
        </div>
      </Container>
    </>
  );
}
