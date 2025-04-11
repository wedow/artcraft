import { Button, Container, Panel } from "components/common";
import React from "react";
import { useHistory } from "react-router-dom";

interface LoginBlockProps {
  title?: string;
  message?: string;
  redirect?: string;
}

export default function LoginBlock({
  title = "You need to be logged in to use this product.",
  message = "Please login or create an account to proceed.",
  redirect,
}: LoginBlockProps) {
  const history = useHistory();

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ height: "calc(100vh - 65px)" }}
    >
      <Container
        type="panel"
        className="narrow-container d-flex flex-column align-items-center justify-content-center gap-4"
      >
        <Panel padding={true}>
          {/* <div className="d-flex py-4 justify-content-center w-100">
            <div
              style={{
                aspectRatio: "4/3",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                borderRadius: "0.5rem",
                overflow: "hidden",
                maxWidth: "340px",
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
          </div> */}
          <div className="d-flex flex-column align-items-center py-4">
            <h4 className="fw-bold mb-1 text-center">{title}</h4>
            <p className="opacity-75 text-center">{message}</p>
            <div className="d-flex gap-2 mt-2">
              <Button
                label="Login"
                className="mt-3"
                onClick={() => {
                  history.push(
                    `/login${redirect ? `?redirect=${redirect}` : ""}`.trim()
                  );
                }}
                variant="secondary"
              />
              <Button
                label="Sign Up"
                className="mt-3"
                onClick={() => {
                  history.push(
                    `/signup${redirect ? `?redirect=${redirect}` : ""}`.trim()
                  );
                }}
              />
            </div>
          </div>
        </Panel>
      </Container>
    </div>
  );
}
