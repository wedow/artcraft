import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faPatreon } from "@fortawesome/free-brands-svg-icons";
import { ThirdPartyLinks } from "../constants/ThirdPartyLinks";

interface Props {
  text?: string;
  iconAfterText?: boolean;
}

function PatreonLink(props: Props) {
  const linkText = props.text === undefined ? "Discord" : props.text;
  const iconAfterText = props.iconAfterText ? true : false;
  const linkBody = iconAfterText ? (
    <>
      {linkText}{" "}
      <FontAwesomeIcon icon={faPatreon as IconProp} title={linkText} />
    </>
  ) : (
    <>
      <FontAwesomeIcon icon={faPatreon as IconProp} title={linkText} />{" "}
      {linkText}
    </>
  );
  return (
    <a
      href={ThirdPartyLinks.FAKEYOU_PATREON}
      target="_blank"
      rel="noopener noreferrer"
    >
      {linkBody}
    </a>
  );
}

export { PatreonLink };
