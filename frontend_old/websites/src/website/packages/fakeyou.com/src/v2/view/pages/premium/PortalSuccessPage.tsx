import React from "react";
import { Link } from "react-router-dom";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function PortalSuccessPage() {
  PosthogClient.recordPageview();

  return (
    <div>
      <div className="container mb-4">
        <div className="row gx-3 flex-lg-row-reverse align-items-center">
          <div className="col-lg-6">
            <div className="d-flex justify-content-center">
              <img
                src="/mascot/kitsune_pose3.webp"
                className="img-fluid"
                width="516"
                height="444"
                alt="FakeYou Kitsune Mascot!"
              />
            </div>
          </div>
          <div className="col-lg-6 px-md-2 ps-lg-5 ps-xl-2">
            <div className="text-center text-lg-start">
              <div>
                <h1 className=" fw-bold lh-1 mb-4">Thank You!</h1>
              </div>
              <div>
                <p className="lead">Your support means a lot to us.</p>
                <p className="lead">Please continue to enjoy FakeYou!</p>
              </div>
            </div>
          </div>
          <div className="col-lg-12">
            <div className="d-flex justify-content-center">
              <Link to="/" className="btn btn-primary  fs-6">
                Back to FakeYou
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
