import React from "react";
import { faTwitch } from "@fortawesome/free-brands-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  hideIcon?: boolean;
  iconBeforeText?: boolean;
  title?: string;
  children?: string | Element | Array<any>; // Optional link text, child elements, etc.
}

function TwitchLabsLink(props: Props) {
  let linkBody =
    props.children === undefined ? <>Twitch</> : <>{props.children}</>;

  const showIcon = !(props.hideIcon ? true : false);
  const iconBeforeText = props.iconBeforeText ? true : false;

  const linkTitle = props.title ? props.title : "FakeYou Twitch";

  if (showIcon) {
    linkBody = iconBeforeText ? (
      <>
        <FontAwesomeIcon icon={faTwitch as IconProp} title={linkTitle} />{" "}
        {linkBody}
      </>
    ) : (
      <>
        {linkBody}{" "}
        <FontAwesomeIcon icon={faTwitch as IconProp} title={linkTitle} />
      </>
    );
  }

  return (
    <a
      href="https://www.twitch.tv/FakeYouLabs"
      target="_blank"
      rel="noopener noreferrer"
    >
      {linkBody}
    </a>
  );
}

export { TwitchLabsLink };
