import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useModal } from "hooks";
import { getLocalStorageItem, setLocalStorageItem } from "utils/localStorage";
import SignUpQuestionnaireForm from "./SignUpQuestionnaireForm";

const SignUpQuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { open } = useModal();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromSignup = params.get("from") === "signup";
    const signupCTAOpened = getLocalStorageItem("signupCTAOpened");

    if (fromSignup && !signupCTAOpened) {
      open({
        component: SignUpQuestionnaireForm,
      });

      setLocalStorageItem("signupCTAOpened", "true");
    }
  }, [location, open]);

  return <>{children}</>;
};

export default SignUpQuestionnaireProvider;
