import React from "react";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { GetWebsite, Website } from "../env/GetWebsite";
import { GetDiscordLink } from "../env/GetDiscordLink";

interface Props {
  hideIcon?: boolean;
  iconBeforeText?: boolean;
  title?: string;
  children?: string | Element | Array<any>; // Optional link text, child elements, etc.
}

function DiscordLink2(props: Props) {
  let linkBody =
    props.children === undefined ? <>Discord</> : <>{props.children}</>;

  const showIcon = !(props.hideIcon ? true : false);
  const iconBeforeText = props.iconBeforeText ? true : false;

  const discordLink = GetDiscordLink();
  const website = GetWebsite();

  const defaultTitle = 
    website.website === Website.FakeYou ? 
      "FakeYou Discord" : 
      "Storyteller Discord" ;

  const linkTitle = props.title ? props.title : defaultTitle;

  if (showIcon) {
    linkBody = iconBeforeText ? (
      <>
        <FontAwesomeIcon icon={faDiscord as IconProp} title={linkTitle} />{" "}
        {linkBody}
      </>
    ) : (
      <>
        {linkBody}{" "}
        <FontAwesomeIcon icon={faDiscord as IconProp} title={linkTitle} />
      </>
    );
  }

  return (
    <a
      href={discordLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      {linkBody}
    </a>
  );
}

export { DiscordLink2 };
