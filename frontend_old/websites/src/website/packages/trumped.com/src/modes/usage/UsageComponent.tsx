import React from "react";

interface Props {
  resetModeCallback: () => void;
}

function UsageComponent(props: Props) {
  return (
    <div id="usage" className="mt-5">
      <h1>Usage Recommendations</h1>

      <h3>Short sentences are bad</h3>

      <p>
        Don't say things like "hello" or "hi". They're too short for the current
        model to generate good audio from. This may improve in the future, but
        it is low on the list of priorities.
      </p>

      <h3>Try and try again</h3>

      <p>
        If you're unhappy with how the results sound, try changing the words a
        litle. Experiment. Try adding punctuation, such as periods and question
        marks.
      </p>

      <h3>Use real words</h3>

      <p>"Asdfagdadf" is not a word, and Trump won't know how to say it.</p>

      <h3>Sound out difficult words</h3>

      <p>
        If the words you want to use aren't working, that's likely because I
        trained the network on phonemes instead of raw text. This phonetic
        information comes from a database, and although this database contains
        over 130,000 words, it unfortunately doesn't have entries such as
        "Fortnite".
      </p>

      <p>
        To make this work, try sounding out the problematic words: "pikachu is a
        pokemon" can be rewritten as "peek ah choo is a poke ay mon". You can
        try "Fort Night" instead of "Fortnite".
      </p>

      <p>
        I'll fix this issue as soon as I can, because I know how important this
        is to you.
      </p>

      <h3>Example sentences</h3>

      <p>Try getting Trump to say the following:</p>

      <ul>
        <li>Why does it always rain on Christmas? It's so depressing.</li>
        <li>I really appreciate how good of a friend you are.</li>
        <li>You're clearly not trying hard enough. What's up with you?</li>
        <li>
          The Dinosaurs were the dominant land animals of the Mesozoic era. Over
          500 different genera of dinosaurs are known. Fossils of dinosaurs have
          been found on every continent, and there are still frequent new
          discoveries.
        </li>
        <li>
          Dinosaurs had adaptations which helped make them successful. The first
          known dinosaurs were small predators that walked on two legs. All
          their descendants had an upright posture, with the legs underneath the
          body. This transformed their whole lifestyle.
        </li>
        <li>Are you really reading this far? Good for you.</li>
      </ul>

      <button onClick={() => props.resetModeCallback()}>Go Back</button>
    </div>
  );
}

export { UsageComponent };
