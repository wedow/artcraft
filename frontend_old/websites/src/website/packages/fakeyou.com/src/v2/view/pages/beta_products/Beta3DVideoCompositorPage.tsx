import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Button, Container, Panel } from "components/common";
import { AITools } from "components/marketing";
import React from "react";
// import { Widget } from "@typeform/embed-react";

export default function Beta3DVideoCompositorPage() {
  usePrefixedDocumentTitle("Beta 3D Video Compositor");
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
                  <source src="/videos/ai-tools/vcomp_video.mp4" />
                </video>
              </div>
            </div>
            <div className="d-flex flex-column align-items-center py-4">
              <h2 className="fw-bold mb-2 text-center">
                We're currently building 3D Video Compositor!
              </h2>
              <p className="opacity-75 text-center">
                Use our 3D engine to build videos!
                <br />
                Join the waitlist today!
              </p>
              <div className="d-flex gap-2 mt-2">
                <Button
                  label="Join the waitlist"
                  className="mt-4"
                  to="/beta/3d-video-compositor/form"
                  variant="primary"
                  icon={faArrowRight}
                  iconFlip={true}
                />
              </div>
            </div>
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
