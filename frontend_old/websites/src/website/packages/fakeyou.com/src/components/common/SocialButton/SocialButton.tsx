import {
  faFacebookF,
  faRedditAlien,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import {
  faArrowDownToLine,
  faEnvelope,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import "./SocialButton.scss";
import { ReactComponent as XLogo } from "./TwitterX.svg";

export type Socials =
  | "x"
  | "whatsapp"
  | "facebook"
  | "reddit"
  | "email"
  | "download";

interface SocialButtonProps {
  bucketUrl?: string;
  GApage?: string;
  hideLabel?: boolean;
  social: Socials;
  shareUrl?: string;
  shareText: string;
}

export default function SocialButton({
  bucketUrl,
  GApage,
  hideLabel,
  social,
  shareUrl,
  shareText,
}: SocialButtonProps) {
  const socialIcons = {
    x: XLogo,
    whatsapp: faWhatsapp,
    facebook: faFacebookF,
    reddit: faRedditAlien,
    email: faEnvelope,
    download: faArrowDownToLine,
  };

  const getShareLink = (social: string, url: string, text: string) => {
    switch (social) {
      case "x":
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
      case "whatsapp":
        return `https://wa.me/?text=${encodeURIComponent(
          text
        )} ${encodeURIComponent(url)}`;
      case "reddit":
        return `https://www.reddit.com/submit?url=${encodeURIComponent(
          url
        )}&title=${encodeURIComponent(text)}`;
      case "email":
        return `mailto:?subject=${encodeURIComponent(
          text
        )}&body=${encodeURIComponent(url)}`;
      case "download":
        return bucketUrl;
      default:
        return "#";
    }
  };

  return (
    <a
      {...{
        className: "social-button",
        href: getShareLink(social, shareUrl || "", shareText),
        target: "_blank",
        ...(social === "download"
          ? {
              download: true,
              onClick: () => {
                // @ts-ignore
                window.dataLayer.push({
                  event: "media_file_download",
                  page: GApage || "/",
                  user_id: "$user_id",
                });
              },
            }
          : {}),
      }}
    >
      <div
        className={`${
          !hideLabel ? "social-button-icon" : "social-button-icon-no-style"
        } bg-${social}`}
      >
        {social === "x" ? (
          <XLogo style={{ width: "32px", height: "32px", fill: "white" }} />
        ) : (
          <FontAwesomeIcon icon={socialIcons[social]} />
        )}
      </div>
      {!hideLabel ? (
        <p className="social-button-text">
          {social.charAt(0).toUpperCase() + social.slice(1)}
        </p>
      ) : null}
    </a>
  );
}
