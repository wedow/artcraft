import React from "react";
import { Link } from "react-router-dom";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

interface Props {}

export default function VocodesPage(props: Props) {
  PosthogClient.recordPageview();
  return (
    <div className="content is-medium">
      <section className="hero is-small">
        <div className="hero-body">
          <div className="columns is-vcentered">
            <div className="column is-one-third">
              <div className="mascot">
                <img
                  src="/mascot/kitsune_pose2_black_2000.webp"
                  alt="FakeYou Kitsune Mascot!"
                />
              </div>
            </div>

            <div className="column">
              <p className="title">Vocodes is now FakeYou</p>
              <p className="subtitle">
                The old <strong>vo.codes voices</strong> will return. Please be
                patient.
              </p>
            </div>
          </div>
        </div>
      </section>

      <h1 className="title is-4">Vocodes wasn't Tacotron or Talknet</h1>

      <p>
        We had a rather unusual and bespoke architecture. Resurrecting it will
        take some time. We know the vocodes voices are highly sought after for
        memes, and we're constantly being asked to bring them back. Please be
        patient with us.
      </p>

      <Link
        to="/"
        className="button is-fullwidth is-primary is-large is-danger"
      >
        Use FakeYou
      </Link>

      <br />

      <p>
        (FakeYou sounds better, but we know the meme voices are important. They
        will return.)
      </p>
    </div>
  );
}
