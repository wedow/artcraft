import React from "react";
import { Link } from "react-router-dom";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function CheckoutCancelPage() {
  PosthogClient.recordPageview();

  return (
    <div>
      <div className="container mb-4">
        <div className="row gx-3 flex-lg-row-reverse align-items-center">
          <div className="col-lg-6">
            <div className="d-flex justify-content-center">
              <img
                src="/mascot/kitsune_pose7.webp"
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
                <h1 className=" fw-bold lh-1 mb-4">Oh no!</h1>
              </div>
              <div>
                <p className="lead">
                  It's okay if you don't want to support FakeYou right now, but
                  we'd appreciate it if you reconsider us in the future.
                </p>
                <br />
                <p className="lead">
                  Paid plans go directly to helping us afford more GPUs,
                  engineering, and research talent.
                </p>
                <br />
                <p className="lead">
                  We're trying to build a film and music production system that
                  you can use to make any content you dream up. Please consider
                  supporting us monetarily.
                </p>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="d-flex justify-content-center">
              <Link to="/" className="btn btn-secondary fs-6">
                Back to FakeYou
              </Link>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="d-flex justify-content-center">
              <Link to="/pricing" className="btn btn-primary  fs-6">
                Select a Premium Plan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
