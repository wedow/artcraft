import React from "react";
import Container from "../Container";
import Panel from "../Panel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMessageExclamation,
} from "@fortawesome/pro-solid-svg-icons";
import Button from "../Button";
import RemixScenes from "../RemixScenes";

interface DeviceNotSupportedProps {
  showButton?: boolean;
  showRemixScenes?: boolean;
  showVST?: boolean;
}

export default function DeviceNotSupported({
  showButton = true,
  showRemixScenes = true,
  showVST = false,
}: DeviceNotSupportedProps) {
  return (
    <Container type="panel">
      <Panel padding={true} className="py-5 d-flex flex-column gap-4">
        <div className="text-center d-flex flex-column gap-3 align-items-center">
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "100%",
              backgroundColor: "#E66462",
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "1.75rem",
            }}
          >
            <FontAwesomeIcon icon={faMessageExclamation} />
          </div>

          <h3 className="fw-bold">Device not supported!</h3>
          <p className="px-2">
            Mobile devices are not supported at this time. Please log into
            <b className="text-red fw-medium"> Storyteller.ai</b> on a desktop
            computer to access Storyteller Studio.
          </p>

          {showRemixScenes && (
            <>
              <hr className="w-100" />
              <p className="px-2 fw-medium fs-5">
                You'll be able to create creative scenes like these...
              </p>
            </>
          )}
        </div>

        {showRemixScenes && (
          <>
            <RemixScenes allowRemix={false} />

            <p className="px-2 fw-medium fs-5 text-center">
              Log into <b className="text-red fw-medium"> Storyteller.ai</b> on
              a desktop computer to start creating now!
            </p>
          </>
        )}

        {showVST && (
          <>
            <hr />
            <div>
              <p className="px-2 fw-bold fs-5 text-center mb-3">
                Would you like to try Video Style Transfer instead?
              </p>
              <p className="px-2 fw-normal fs-6 text-center">
                Convert videos into any art style with AI. Choose a style, write
                a prompt and apply it to your video, works on mobile!
              </p>
            </div>

            <div className="d-flex justify-content-center mt-3">
              <Button
                to="/style-video"
                label="Stylize a Video"
                icon={faArrowRight}
                iconFlip={true}
                variant="primary"
              />
            </div>
          </>
        )}

        {showButton && (
          <div className="d-flex justify-content-center mt-3">
            <Button
              to="/"
              label="Back to Homepage"
              icon={faArrowLeft}
              variant="primary"
            />
          </div>
        )}
      </Panel>
    </Container>
  );
}
