import React from "react";
import { GitSha } from "@storyteller/components/src/elements/GitSha";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDiscord,
  faFacebook,
  faTwitch,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { GetDiscordLink } from "@storyteller/components/src/env/GetDiscordLink";

interface Props {}

function Footer(props: Props) {
  return (
    <>
      <footer data-scroll-section>
        <div className="bg-dark-solid">
          <div className="container footer-top text-center">
            <div className="d-flex gap-4 justify-content-center p-4 pb-5">
              <a
                href={GetDiscordLink()}
                className="footer-social-icon"
                rel="noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon icon={faDiscord} />
              </a>
              <a
                href="https://twitch.tv/FakeYouLabs"
                className="footer-social-icon"
                rel="noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon icon={faTwitch} />
              </a>
              <a
                href="https://facebook.com/vocodes"
                className="footer-social-icon"
                rel="noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a
                href="https://twitter.com/intent/follow?screen_name=FakeYouApp"
                className="footer-social-icon"
                rel="noreferrer"
                target="_blank"
              >
                <FontAwesomeIcon icon={faTwitter} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container d-flex flex-column text-center gap-2">
            <div>
              Copyright &copy; 2023 Storyteller AI. All Rights Reserved.
            </div>

            <div className="opacity-50">
              <GitSha />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export { Footer };
