import React, { useCallback, useState } from "react";
import { Widget } from "@typeform/embed-react";
import ModalHeader from "components/modals/ModalHeader";
import { set } from "local-storage";

interface EmailSignUpProps {
  mobile?: boolean;
  showHanashi?: boolean;
  handleClose?: any;
}

export function EmailSignUp({
  mobile,
  showHanashi = true,
  handleClose,
}: EmailSignUpProps) {
  const [isHanashiHovered, setIsHanashiHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setIsHanashiHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHanashiHovered(false), []);

  return (
    <div>
      {handleClose && (
        <div style={{ marginBottom: "56px" }}>
          <ModalHeader title=" " handleClose={handleClose} />
        </div>
      )}
      <h1 className="text-center mb-5 fw-bold display-5">
        Join the waitlist today!
      </h1>
      <div
        style={{
          paddingTop: mobile ? "0px" : "60px",
          backgroundColor: "#242433",
          borderRadius: "1rem",
          borderTop: handleClose ? "none" : "3px solid #e66462",
          position: "relative",
        }}
      >
        {showHanashi && (
          <img
            src={
              isHanashiHovered
                ? "/images/landing/hanashi-demo-2.webp"
                : "/images/landing/hanashi-demo-1.webp"
            }
            alt="Hanashi Demo"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            draggable="false"
            style={{
              top: "-49%",
              right: "3%",
              width: "390px",
              position: "absolute",
            }}
            className="d-none d-xxl-block"
          />
        )}

        <Widget
          onSubmit={() => {
            set<boolean>("firstFormIsSubmitted", true);
          }}
          id="TKSc5ImN"
          style={{ width: "100%", height: "300px" }}
        />
      </div>
    </div>
  );
}

export default React.memo(EmailSignUp);
