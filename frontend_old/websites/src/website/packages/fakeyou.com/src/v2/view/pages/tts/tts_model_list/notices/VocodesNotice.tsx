import React from "react";

interface Props {
  clearVocodesNotice: () => void;
}

function VocodesNotice(props: Props) {
  return (
    <>
      {/* Alternate style message flash:
      <article className="message is-link">
        <div className="message-body">
          <em>Vocodes</em> is now <strong><em>FakeYou</em></strong>!
          Why the change? Not many know what vocoders are, so the old name was kind of silly. 
          We've also got lots of ambitious plans for the future, including a full set of virtual
          production and deepfake tools, so stay tuned.
        </div>
      </article>*/}
      <div className="container">
        <div
          className="alert alert-secondary alert-dismissible fade show"
          role="alert"
        >
          <button
            className="btn-close"
            onClick={() => props.clearVocodesNotice()}
            data-bs-dismiss="alert"
            aria-label="Close"
          ></button>
          <em>Vocodes</em> is now{" "}
          <strong>
            <em>FakeYou</em>
          </strong>
          ! Why the change? Not many know what vocoders are, so the old name was
          kind of silly. We've also got lots of ambitious plans for the future,
          including a full set of virtual production and deepfake tools, so stay
          tuned.
          <br />
          (You can access us at <a href="https://fakeyou.com">FakeYou.com</a> to
          get rid of this notice forever.)
        </div>
      </div>
    </>
  );
}

export { VocodesNotice };
