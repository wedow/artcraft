import { Button, Container, Panel } from "components/common";
import React from "react";
import { useHistory } from "react-router-dom";

export function StyleVideoNotAvailable() {
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
          <div className="d-flex flex-column align-items-center py-4">
            <h4 className="fw-bold mb-1 text-center">
              You need to be logged in to use Video Style Transfer.
            </h4>
            <p className="opacity-75 text-center">
              Please login or create an account to proceed.
            </p>
            <div className="d-flex gap-2 mt-2">
              <Button
                label="Sign Up"
                className="mt-3"
                onClick={() => {
                  history.push("/signup");
                }}
              />
              <Button
                label="Login"
                className="mt-3"
                onClick={() => {
                  history.push("/login");
                }}
                variant="secondary"
              />
            </div>
          </div>
        </Panel>
      </Container>
    </div>
  );
}
