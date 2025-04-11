import React from "react";
import Button from "../Button";
import { faArrowLeft } from "@fortawesome/pro-solid-svg-icons";

interface BackButtonProps {
  onClick?: () => void;
  to?: string;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, to, label }) => {
  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  if (to) {
    return (
      <Button
        icon={faArrowLeft}
        label={label ? label : "Back"}
        variant="link"
        to={to}
      />
    );
  }

  return (
    <Button
      icon={faArrowLeft}
      label={label ? label : "Back"}
      variant="link"
      onClick={handleBack}
    />
  );
};

export default BackButton;
