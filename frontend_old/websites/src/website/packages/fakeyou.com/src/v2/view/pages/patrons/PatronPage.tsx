import React from "react";
import { PATRONS } from "../../../../data/Patrons";
import { PatreonLink } from "@storyteller/components/src/elements/PatreonLink";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPatreon } from "@fortawesome/free-brands-svg-icons";

import { ThirdPartyLinks } from "@storyteller/components/src/constants/ThirdPartyLinks";
import { usePrefixedDocumentTitle } from "../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function PatronPage() {
  usePrefixedDocumentTitle("Thank you to our Patrons!");
  PosthogClient.recordPageview();

  return (
    <div>
      <div className="container py-5 pt-lg-0">
        <div className="row">
          <div className="col-12 col-lg-7 d-flex flex-column justify-content-center text-center text-lg-start px-3 px-md-2 px-lg-5 px-xl-3">
            <h1 className=" fw-bold">Thanks to our Patrons!</h1>
            <h3 className="mb-4 px-4 px-md-0">
              Our Patrons help support our work.
            </h3>
            <p className="lead mb-5">
              Our Patrons help pay offset (but not completely cover) our
              expensive server bills.
            </p>

            <div className="d-flex justify-content-center justify-content-lg-start">
              <a
                href={ThirdPartyLinks.FAKEYOU_PATREON}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                <FontAwesomeIcon icon={faPatreon} className="me-2" />
                Support us on Patreon
              </a>
            </div>
          </div>
          <div className="col-12 col-lg-5 d-flex flex-column align-items-center">
            <img
              className="img-fluid mt-5 mw-50"
              src="/mascot/kitsune_pose7.webp"
              alt="FakeYou Mascot"
              width="423"
              height="387"
            />
          </div>
        </div>
      </div>

      <div className="container-panel pb-5">
        <div className="panel p-3 p-lg-4">
          <h1 className="panel-title fw-bold">Our Patrons</h1>
          <div className="py-6">
            <div className="row text-center">
              <ul className="patrons-list col-12 col-md-4 w-100">
                {PATRONS.map(patron => {
                  return (
                    <li>
                      {patron.username} &mdash; ${patron.donationTotal}
                    </li>
                  );
                })}
              </ul>
              <div className="col-12 col-md-4"></div>
              <div className="col-12 col-md-4"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        <div>
          <p>
            Patrons will get first looks at new features, get dedicated access
            to Patron-only Discord channels, can ask for specific voices from
            our in-house audio engineers, and more!
            <br />
            <br />
            Please consider{" "}
            <PatreonLink text="donating on Patreon" iconAfterText={true} />
          </p>
        </div>
      </div>
    </div>
  );
}
