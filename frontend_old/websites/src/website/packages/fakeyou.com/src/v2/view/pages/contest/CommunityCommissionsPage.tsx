import React from "react";
import { Link } from "react-router-dom";

import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWaveformLines } from "@fortawesome/pro-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";
import { GetDiscordLink } from "@storyteller/components/src/env/GetDiscordLink";

export default function CommunityCommissionsPage() {
  usePrefixedDocumentTitle("Voice to Voice Community Commissions");
  PosthogClient.recordPageview();

  return (
    <div>
      <div className="container pt-3 pt-lg-5 pb-5">
        <div className="row gx-3 align-items-center">
          <div className="col-lg-5">
            <div className="d-flex justify-content-center justify-content-lg-start mb-4 mb-lg-0">
              <img
                src="/mascot/contest.webp"
                className="img-fluid"
                width="330"
                alt="FakeYou Kitsune Mascot!"
              />
            </div>
          </div>
          <div className="col-lg-7 px-md-2 ps-lg-5 ps-xl-2">
            <div className="text-center text-lg-start">
              <div>
                <h1 className=" fw-bold lh-1 mb-4 display-5">
                  Voice to Voice
                  <br />
                  Community Commissions
                </h1>
              </div>
              <div>
                <p className="lead">
                  We're pleased to announce a pool of over <b>$5,000</b> in
                  rewards to creators in our community for creating quality
                  Voice to Voice models!
                </p>
                <div className="d-flex flex-column flex-md-row gap-3 mt-3 pt-3 justify-content-center justify-content-lg-start">
                  <Link
                    to="/upload/voice_conversion"
                    className="btn btn-primary"
                  >
                    <FontAwesomeIcon icon={faWaveformLines} className="me-2" />
                    Upload Voice Model
                  </Link>
                  <a
                    href={GetDiscordLink()}
                    className="btn btn-discord text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faDiscord} className="me-2" />
                    Join the Discord
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-panel pt-lg-5 pb-5">
        <div className="panel p-3 p-lg-4 load-hidden mt-5 mt-lg-0">
          <h1 className="panel-title fw-bold">Details</h1>
          <div className="py-6 d-flex flex-column gap-4">
            <p>
              You may have noticed we recently added a new feature on the
              website called{" "}
              <Link to="/voice-conversion">"Voice to Voice"!</Link> If you
              haven't checked it out yet, it lets you upload an audio sample, or
              record directly on the website, and transform your voice into
              somebody else's. We've been working really hard on voice
              conversion, and this is just the first of many releases we have
              lined up using this technology. Please, check it out and let us
              know what you think! We're already working on new features for it,
              so stay tuned for those!
              <br />
              <br />
              You might be wondering where the 3000+ voices offered by our Text
              to Speech engine are. The voices on FakeYou are created by... You,
              the community! Since this is a new feature, it needs new models,
              and we need to train those new models.
              <br />
              <br />
              We're offering the opportunity to earn rewards for creating Voice
              to Voice models. If that sounds like something you'd be interested
              in, please click the button below! We're super excited to see what
              the community cooks up. ✌️
            </p>
            <a
              href="https://docs.google.com/document/d/1BBmBNt04ceT8JB8Qgr02_c4yKzXg4WDZ3Kl8fJVlQE0"
              className="btn btn-primary"
              target="_blank"
              rel="noreferrer"
            >
              Start Creating Voice Models
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
