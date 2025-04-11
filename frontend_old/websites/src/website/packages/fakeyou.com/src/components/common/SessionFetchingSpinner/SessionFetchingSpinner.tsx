import React from "react";
import Container from "../Container";
import LoadingSpinner from "../LoadingSpinner";

export default function SessionFetchingSpinner() {
  return (
    <Container
      type="panel"
      className="narrow-container"
      style={{ height: "calc(100vh - 65px)" }}
    >
      <div className="d-flex align-items-center justify-content-center h-100 gap-4">
        <LoadingSpinner
          label="Loading"
          className="me-3 fs-6"
          labelClassName="fs-4"
        />
      </div>
    </Container>
  );
}
