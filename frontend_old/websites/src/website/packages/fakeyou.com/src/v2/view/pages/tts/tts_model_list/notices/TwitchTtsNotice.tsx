import React from "react";

interface Props {
  clearTwitchTtsNotice: () => void;
}

function TwitchTtsNotice(props: Props) {
  return (
    <>
      <div className="container">
        <div
          className="alert alert-secondary alert-dismissible fade show"
          role="alert"
        >
          <button
            className="btn-close"
            onClick={() => props.clearTwitchTtsNotice()}
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
          <strong>
            If you stream on Twitch, we have a brand new platform for you!
          </strong>
          <br />
          Allow us to introduce{" "}
          <a
            href="https://create.storyteller.io"
            target="_blank"
            rel="noreferrer"
          >
            <strong>Storyteller</strong>
          </a>
          , a free, zero-download, easy to use platform that lets you use
          FakeYou voices on your Twitch stream. Your audience can use bits,
          channel points, and soon much more. We've got a ton of features in
          store.{" "}
          <a
            href="https://create.storyteller.io"
            target="_blank"
            rel="noreferrer"
          >
            Try it out and let us know what you think!
          </a>
          <br />
          You think voices are neat? Just wait until we show you what else we've
          been working on&hellip;
        </div>
      </div>
    </>
  );
}

export { TwitchTtsNotice };
