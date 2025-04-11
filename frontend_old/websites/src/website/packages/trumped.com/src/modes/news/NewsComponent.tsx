import React from "react";

interface Props {
  resetModeCallback: () => void;
}

function NewsComponent(props: Props) {
  return (
    <div id="updates" className="mt-5">
      <h1> Updates </h1>

      <h3>Mar 19, 2023: That whole AI thing.</h3>

      <p>Turns out AI was pretty big. Wow.</p>

      <h3>June 7, 2020: Website rewrite.</h3>

      <p>
        I rewrote the incredibly dated frontend in React and added help, news,
        and other information. The frontend won't be a huge concern for me going
        forward, but I'll periodically continue to make upgrades. One critical
        feature I intend to add is the ability to download audio files and
        replay them.
      </p>

      <h3>June 4, 2020: There's a new model.</h3>

      <p>
        I replaced the old model with a completely new one that doesn't crash
        and is a 10x speed up over the last one. While it doesn't currently
        sound as good as the old model, the performance improvements were good
        enough to warrant using it immediately. I'll make it sound better soon.
        So many things in the pipeline...
      </p>

      <h3>May 30, 2020: Intermittent failure.</h3>

      <p>
        There's now another issue with how models are distributed to the
        workers. I have a solution in the works and expect it to be in place
        before morning tomorrow.
      </p>

      <h3>May 25, 2020: I'm actively working on development.</h3>

      <p>
        This site has been sitting in limbo for four years. It used to use
        concatenative TTS, but now uses Tacotron. I've been working on ML for
        the past year, but haven't taken the time to update this website.
      </p>

      <p>
        I've got an improved model in the works, and I'm focused on scaling the
        cluster. There's an occasional server crash bug I'm chasing down (right
        now the server instances respawn when they die). The frontend will be
        updated soon to no longer cache results.
      </p>

      <button onClick={() => props.resetModeCallback()}>Go Back</button>
    </div>
  );
}

export { NewsComponent };
