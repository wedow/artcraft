import React from "react";
import { Link } from "react-router-dom";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function CheckoutSuccessPage() {
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
                <h1 className=" fw-bold lh-1 mb-4">Thank you!</h1>
              </div>
              <br />
              <div>
                <p className="lead">
                  We're grateful you're helping FakeYou build the future
                  creative suite. We're building tools for small creators and
                  have an eye on building a full AI-powered Hollywood and music
                  production studio.
                </p>
                <br />
                <p className="lead">Your support helps us immensely!</p>
                <br />
                <p className="lead">
                  Please give it a few minutes for your purchase to take effect.
                </p>
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
