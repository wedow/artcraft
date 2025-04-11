import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface Props {
  link: string;
  text?: string;
}

function BackLink(props: Props) {
  const linkText = props.text === undefined ? "Back" : props.text;
  return (
    <Link to={props.link} className="fw-medium">
      <FontAwesomeIcon icon={faArrowLeft} />
      <span className="ms-2">{linkText}</span>
    </Link>
  );
}

export { BackLink };
