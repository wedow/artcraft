import React from "react";
import Panel from "../../common/Panel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Button from "components/common/Button";
import ButtonProps from "components/common/Button/ButtonProps";
import BackButton from "components/common/BackButton";

interface BackConfig {
  label: string;
  to: string;
}

interface PageHeaderProps {
  back?: BackConfig;
  titleIcon?: IconDefinition;
  title: string | React.ReactNode;
  titleH2?: boolean;
  subText?: string | React.ReactNode;
  full?: boolean;
  showButton?: boolean;
  extension?: React.ReactNode;
  buttonLabel?: string;
  button?: ButtonProps;
  secondaryButtonLabel?: string;
  secondaryButton?: ButtonProps;
  secondaryButtonVariant?: "primary" | "secondary" | "danger";
  secondaryButtonTo?: string;
  secondaryButtonIcon?: IconDefinition;
  secondaryButtonOnClick?: () => void;
  buttonVariant?: "primary" | "secondary" | "danger";
  buttonTo?: string;
  buttonIcon?: IconDefinition;
  buttonOnClick?: () => void;
  panel?: boolean;
  imageUrl?: string;
  showBackButton?: boolean;
  backbuttonTo?: string;
  backbuttonLabel?: string;
}

export default function PageHeader({
  back,
  titleIcon,
  title,
  titleH2 = false,
  subText,
  full,
  showButton,
  extension,
  button,
  buttonLabel,
  buttonVariant = "primary",
  buttonTo,
  buttonIcon,
  buttonOnClick,
  panel = false,
  imageUrl,
  showBackButton,
  backbuttonTo,
  backbuttonLabel,
  secondaryButton,
  secondaryButtonLabel,
  secondaryButtonVariant = "secondary",
  secondaryButtonTo,
  secondaryButtonIcon,
  secondaryButtonOnClick,
}: PageHeaderProps) {
  const icon = (
    <>
      {titleIcon && <FontAwesomeIcon icon={titleIcon} className="me-3 fs-2" />}
    </>
  );

  const buttonProps = {
    ...(button ? button : {}),
    ...(buttonIcon && { icon: buttonIcon }),
    ...(buttonLabel && { label: buttonLabel }),
    ...(buttonOnClick && { onClick: buttonOnClick }),
    ...(buttonTo && { to: buttonTo }),
    ...(buttonVariant && { variant: buttonVariant }),
  };

  const secondaryButtonProps = {
    ...(secondaryButton ? secondaryButton : {}),
    ...(secondaryButtonIcon && { icon: secondaryButtonIcon }),
    ...(secondaryButtonLabel && { label: secondaryButtonLabel }),
    ...(secondaryButtonOnClick && { onClick: secondaryButtonOnClick }),
    ...(secondaryButtonTo && { to: secondaryButtonTo }),
    ...(secondaryButtonVariant && { variant: secondaryButtonVariant }),
  };

  const HeaderBtn = () =>
    button || showButton ? <Button {...buttonProps} /> : null;

  const HeaderBtnTwo = () =>
    secondaryButton ? <Button {...secondaryButtonProps} /> : null;

  if (!panel) {
    return (
      <div className="py-4">
        <Panel clear={true}>
          {(back || showBackButton) && (
            <div className="d-flex my-2 my-lg-3">
              <BackButton
                label={back ? back.label : backbuttonLabel}
                to={back ? back.to : backbuttonTo}
              />
            </div>
          )}
          <div className="row">
            <div
              className={`d-flex flex-column ${
                imageUrl ? "col-lg-7" : "col-12"
              } justify-content-center gap-4`}
            >
              <div>
                {titleH2 ? (
                  <h2 className="fw-bold d-flex align-items-center">
                    {icon}
                    {title}
                  </h2>
                ) : (
                  <h1 className="fw-bold d-flex align-items-center">
                    {icon}
                    {title}
                  </h1>
                )}

                <p className={typeof subText === "string" ? "opacity-75" : ""}>
                  {subText}
                </p>
              </div>
              {(button || showButton) && (
                <div className="d-flex gap-3">
                  <HeaderBtn />
                  <HeaderBtnTwo />
                </div>
              )}
            </div>
            <div
              className={`d-none col-lg-5 ${
                imageUrl ? "d-lg-block" : "d-lg-none"
              }`}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Header"
                  className="img-fluid"
                  height="235"
                  loading="lazy"
                />
              )}
            </div>
          </div>
          {extension && <div className="mt-2">{extension}</div>}
        </Panel>
      </div>
    );
  }

  // Default view without image.
  return (
    <div className="pt-3 pb-4 pt-lg-4">
      <Panel padding>
        <div className="d-flex flex-column gap-4">
          <div>
            <div className="d-flex">
              <h1 className="fw-bold flex-grow-1">
                {icon}
                {title}
              </h1>
              <div className="d-none d-md-block">
                <HeaderBtn />
              </div>
            </div>
            <p>{subText}</p>
          </div>
          {extension && <div>{extension}</div>}
        </div>
      </Panel>
    </div>
  );
}
