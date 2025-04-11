import { Widget } from "@typeform/embed-react";
import ModalHeader from "components/modals/ModalHeader";
import { useModal } from "hooks";
import React, { memo, useEffect, useState } from "react";

const MemoizedWidget = memo(({ close }: { close: () => void }) => (
  <Widget
    id="vrny42Pf?typeform-welcome=0"
    style={{ height: "500px", width: "100%" }}
    onSubmit={() => close()}
  />
));

const SignUpQuestionnaireForm = () => {
  const { close } = useModal();
  const [modalHeaderOpacity, setModalHeaderOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setModalHeaderOpacity(1);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="align-items-center justify-content-center">
      <div
        style={{
          opacity: modalHeaderOpacity,
          transition: "opacity 0.5s ease-in-out",
        }}
      >
        <ModalHeader handleClose={() => close()} />
      </div>
      <h2 className="fw-bold text-center mb-3">Thanks for signing up!</h2>
      <MemoizedWidget close={close} />
    </div>
  );
};

export default SignUpQuestionnaireForm;
