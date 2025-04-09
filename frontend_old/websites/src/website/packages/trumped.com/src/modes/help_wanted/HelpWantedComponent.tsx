import React from "react";

interface Props {
  resetModeCallback: () => void;
}

function HelpWantedComponent(props: Props) {
  return (
    <div id="help-wanted" className="mt-5">
      <h1>Help Wanted</h1>

      <h3>Training Data</h3>
      <p>
        Are you currently creating TTS models? I'd be happy to pay to license
        your annotated audio samples. Tell me what voices you have, the sample
        rate, how noisy the data is, and a little about your annotation process.
      </p>

      <h3>3D Modeller</h3>
      <p>
        I'm looking for a 3D artist or animator to make custom models and
        animations for various characters (speaking, walking, articulating).
        Environment, terrain, and world building skills are a huge plus. I could
        rip models from VR Chat and make an attempt myself, but I'm quite busy
        with working on the speech engine.
      </p>

      <p>This is a paid position. It isn't necessarily for this project.</p>

      <h3>Contact</h3>

      <p>Send me a message on Twitter or Gmail (same handle).</p>

      <button onClick={() => props.resetModeCallback()}>Go Back</button>
    </div>
  );
}

export { HelpWantedComponent };
