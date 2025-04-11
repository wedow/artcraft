import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Button, Container, Panel } from "components/common";
import { AITools } from "components/marketing";
import React from "react";
// import { Widget } from "@typeform/embed-react";

export default function BetaLipSyncPage() {
  usePrefixedDocumentTitle("Beta Lip Sync");
  return (
    <>
      <div className="d-flex flex-column align-items-center">
        <Container
          type="panel"
          className="narrow-container d-flex flex-column align-items-center justify-content-center gap-4 mt-5"
        >
          <Panel padding={true}>
            <div className="d-flex pt-4 pb-3 justify-content-center w-100">
              <div
                style={{
                  aspectRatio: "16/9",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  maxWidth: "500px",
                  border: "2px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <video
                  autoPlay
                  playsInline
                  muted
                  loop
                  className="object-fit-cover w-100 h-100"
                >
                  <source src="/videos/ai-tools/ls_video_2.mp4" />
                </video>
              </div>
            </div>
            <div className="d-flex flex-column align-items-center py-4">
              <h2 className="fw-bold mb-2 text-center">
                We're building better Lip Sync!
              </h2>
              <p className="opacity-75 text-center">
                Bring your character to life by uploading their image and voice!
                Ready to see the magic happen?
                <br />
                Join the waitlist today!
              </p>
              <div className="d-flex gap-2 mt-2">
                <Button
                  label="Join the waitlist"
                  className="mt-4"
                  to="/beta/lip-sync/form"
                  variant="primary"
                  icon={faArrowRight}
                  iconFlip={true}
                />
              </div>
            </div>

            {/* <Widget id="ETlmLSEx" style={{ width: "100%", height: "530px" }} /> */}
          </Panel>
        </Container>

        <Container type="panel" className="pt-5 mt-5">
          <Panel clear={true}>
            <h2 className="fw-bold mb-3">Try other AI video tools</h2>
            <AITools />
          </Panel>
        </Container>
      </div>
    </>
  );
}
