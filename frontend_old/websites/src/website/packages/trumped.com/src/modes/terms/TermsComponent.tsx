import React from "react";

interface Props {
  resetModeCallback: () => void;
}

function TermsComponent(props: Props) {
  return (
    <div id="terms" className="pt-5">
      <h1>Terms and Conditions.</h1>

      <h3>Don't use this website for mischief.</h3>

      <p>
        Please have fun with this app amongst your friends and colleages, but
        don't do anything stupid. The actions you take are your own, and I am
        not responsible for any trouble you might get into<sup>&dagger;</sup>.
        Use your best judgment. For example, though you might find it funny,
        please don't use this app to harass the poor people working at Gamestop.
        They don't have Battle Toads.
      </p>

      <h3>Artistic intent.</h3>

      <p>
        This website is a form of artistic expression, parody, and engineering
        creativity. It is not meant to be harmful to anyone in any way. The
        audio generated is sufficiently poor in quality and should not be
        confused with actual speech. Everyone should be able to have a good
        laugh.
      </p>

      <h3>Deep fakes are good.</h3>

      <p>
        So-called <em>deep fakes</em> are not much different for us today than
        Photoshop was for new users of the World Wide Web back in the 90s. It's
        impressive new technology that defies our expectations. Instead of just
        pictures, machine learning can generate complex shapes in all sorts of
        signal domains. It's really impressive stuff.
      </p>

      <p>
        If you restrict the technology out of fear, it becomes the tool of state
        actors. If it's left wide open, it's just a toy. Society will learn to
        accept and enjoy it just as we did with Photoshop.
      </p>

      <p>
        Our brains are already capable of reading passages in other people's
        voices and picturing vivid scenes without them ever existing. Deep
        models give computers the ability to do the same thing. That's powerful.
        This and related advances in computer vision will unlock a higher order
        of creativity than was ever before possible.
      </p>

      <p>
        <em>Don't legislate deep fakes.</em>
      </p>

      <h3>What's next?</h3>

      <p>
        I'll be improving trumped.com, adding more voices, and scaling the app.
        I've got some new models baking in the GPU ovens right now.
      </p>

      <p>I'm very busy between work and my startup, so please give me time.</p>

      <p>
        <sup>&dagger;</sup> Anyone can download Tacotron from Github to produce
        the same results on their own. Trumped.com is not connected with your
        activities.
      </p>

      <button onClick={() => props.resetModeCallback()}>Go Back</button>
    </div>
  );
}

export { TermsComponent };
