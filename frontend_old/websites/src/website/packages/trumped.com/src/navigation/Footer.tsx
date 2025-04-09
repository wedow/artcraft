import React from "react";
import { Mode } from "../AppMode";

interface Props {
  mode: Mode;
  switchModeCallback: (mode: Mode) => void;
}

function Footer(props: Props) {
  return (
    <footer>
      <hr className="mb-3 pb-3" />
      {/*<p>
        Made in Atlanta by&nbsp;
        <a href="https://twitter.com/echelon">@echelon</a>.
      </p>*/}
      <h2>Want more Donald Trump TTS?</h2>
      <p>
        The best <a href="https://fakeyou.com/character/donald-trump">Donald Trump TTS</a> can be found
        at FakeYou.
      </p>
      <p>
        FakeYou is the world's best Text to Speech website and has thousands of
        voices. Angry <a href="https://fakeyou.com/character/donald-trump">Donald J Trump AI Voice</a>, Sad DJ Trump, Hillary Clinton, Nixon, and
        so many others!
      </p>
      <p>
        By using this, you agree to&nbsp;
        <a
          href="#terms"
          onClick={() => props.switchModeCallback(Mode.TERMS_MODE)}
        >
          the things
        </a>
        .
      </p>
    </footer>
  );
}

export { Footer };
