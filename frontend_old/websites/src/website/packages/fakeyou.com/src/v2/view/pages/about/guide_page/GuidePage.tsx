import React from "react";

import { Link } from "react-router-dom";
import { DiscordLink2 } from "@storyteller/components/src/elements/DiscordLink2";
import { usePrefixedDocumentTitle } from "../../../../../common/UsePrefixedDocumentTitle";
import { PosthogClient } from "@storyteller/components/src/analytics/PosthogClient";

export default function GuidePage() {
  PosthogClient.recordPageview();
  usePrefixedDocumentTitle("Guide to all things Deep Fake");

  return (
    <div>
      <div className="container">
        <div className="row gx-3 flex-lg-row-reverse align-items-center">
          <div className="col-lg-6">
            <div className="d-flex justify-content-center">
              <img
                src="/mascot/guide.webp"
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
                <h1 className=" fw-bold lh-1 mb-3">FakeYou TTS Guide</h1>
              </div>
              <div className="mb-5">
                <p className="lead px-5 px-lg-0">
                  <h4>How to generate the best sounding TTS</h4>
                </p>
              </div>
              <div>
                <div className="d-flex justify-content-center justify-content-lg-start mb-5 mb-lg-0">
                  <Link to="/">
                    <button className="btn btn-primary">
                      Generate your TTS
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-panel pt-4 pb-5">
        <div className="panel p-3 p-lg-4 load-hidden mt-5 mt-lg-0">
          <h1 className="panel-title fw-bold">Quick Tips</h1>
          <div className="py-6 d-flex flex-column gap-4">
            <p>
              Here are some quick tips to generate the best sounding
              text-to-speech.
            </p>
            <div>
              <h2 className="mb-4">Fixing nonsense &ldquo;babbling&rdquo;</h2>
              <p>(This is not a typical problem.)</p>
              <br />
              <p>
                Some of our very earliest models were built using a limited
                amount of data and are sometimes prone to producing speech that
                sounds like &ldquo;babbling&rdquo; or incoherent vocal
                convulsions.
              </p>
              <br />
              <p>
                This problem can typically be fixed by{" "}
                <strong>
                  <em>adding ending punctuation to your sentence</em>
                </strong>
                . If the audio still has problems,{" "}
                <strong>
                  <em>add a comma at the start and end of your text</em>
                </strong>{" "}
                so that the program can add brief pauses. This usually corrects
                the problem.
              </p>
              <br />
              <p>
                If the incoherent audio is at the end, you can always edit it
                with software such as Audacity.
              </p>
            </div>
            <div>
              <h2 className="mb-4">Getting the correct pronunciation</h2>
              <p>
                Sometimes a TTS model will not pronounce words correctly or in
                the way you like. You can{" "}
                <strong>
                  <em>experiment with misspellings</em>
                </strong>{" "}
                of words until you get something that sounds better. For example{" "}
                <em>&ldquo;peekahchuu&rdquo;</em> might sound different than{" "}
                <em>&ldquo;pikachu&rdquo;</em>.
              </p>
              <br />
              <p>
                Many of our models also support Arpabet phonetic annotation.
                It's an advanced feature you can learn to use by joining our{" "}
                <DiscordLink2 />.
              </p>
            </div>
            <div>
              <h2 className="mb-4">Emotional conditioning</h2>
              <p>
                To get a certain emotion and personality in the message you
                want, add some extra emotional &ldquo;conditioning&rdquo;.
              </p>
              <br />
              <p>
                To do this, think of a strong emotional sentence or two you
                could start with. Then add this to the very beginning of your
                text. For example, to add some anger to{" "}
                <em>&ldquo;I can't believe you said that to me!&rdquo;</em>, you
                could input the following instead:
              </p>
              <br />
              <p>
                <em>
                  &ldquo;<strong>Darn it! I hate you!</strong> I can't believe
                  you said that to me!&rdquo;
                </em>
              </p>
              <br />
              <p>
                You can later remove these extra leading sentences with an audio
                editor such as Audacity, leaving just the speech you want.
              </p>
            </div>
            <div>
              <h2 className="mb-4">Yelling emotions</h2>
              <p>
                While not all models support it, some of our models incorporate
                rich emotional samples that were transcripted with an emphasis
                mark &ndash; typically an exclamation mark (!).
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-panel pt-4 pb-5">
        <div className="panel p-3 p-lg-4 load-hidden mt-5 mt-lg-0">
          <h2 className="panel-title fw-bold">Generate your TTS now!</h2>
          <div className="py-6 d-flex flex-column gap-4">
            <div>
              <Link to="/">
                <button className="btn btn-primary w-100">
                  Go to text-to-speech generation page
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
