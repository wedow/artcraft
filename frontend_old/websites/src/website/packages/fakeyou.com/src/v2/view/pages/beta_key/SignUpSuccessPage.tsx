import {
  Button,
  Container,
  Panel,
  DeviceNotSupported,
} from "components/common";
import React from "react";
import "./BetaKey.scss";
import {
  faCirclePlay,
  faPersonToPortal,
} from "@fortawesome/pro-solid-svg-icons";
import RemixScenes from "components/common/RemixScenes";
import { isMobile } from "react-device-detect";

export default function SignUpSuccessPage() {
  const handleWatchTutorial = () => {
    window.location.href = "/welcome-to-studio";
  };

  const handleEnterStudio = () => {
    window.location.href = "https://studio.storyteller.ai";
  };

  return (
    <>
      <Container type="panel" className="redeem-container mb-5">
        <div className="d-flex flex-column align-items-center justify-content-center mt-5 pt-lg-3">
          <div className="px-4 d-flex flex-column align-items-center">
            <img
              src="/mascot/kitsune_pose7.webp"
              alt="Success Mascot"
              style={{ maxWidth: "300px" }}
            />
            <div className="d-flex flex-column align-items-center">
              <h2 className="fw-bold mb-1">Welcome!</h2>
              <p className="opacity-75 text-center fs-5 fw-medium">
                You now have access to Storyteller Studio Beta!
                {isMobile && " But..."}
              </p>
            </div>
          </div>
        </div>
      </Container>

      {isMobile ? (
        <DeviceNotSupported />
      ) : (
        <>
          <Container type="panel">
            <Panel padding={true}>
              <div className="d-flex flex-column align-items-center text-center">
                <h3 className="fw-bold mb-1">Let's get started</h3>
                <p className="fw-medium mb-4 fs-5 opacity-75">
                  Click on a scene below to remix it.
                </p>
              </div>

              <RemixScenes />
            </Panel>
          </Container>

          <Container type="panel" className="redeem-container">
            <div className="w-100 d-flex gap-4 justify-content-between my-5 align-items-center">
              <hr className="flex-grow-1" />
              <span className="fw-bold fs-5 opacity-75">OR</span>
              <hr className="flex-grow-1" />
            </div>

            <div className="d-flex gap-3 align-items-center justify-content-center mt-4">
              <Button
                icon={faCirclePlay}
                label="Watch Tutorial"
                onClick={handleWatchTutorial}
                variant="secondary"
              />
              <Button
                icon={faPersonToPortal}
                label="Enter Studio"
                onClick={handleEnterStudio}
                variant="secondary"
              />
            </div>
          </Container>
        </>
      )}
    </>
  );
}
