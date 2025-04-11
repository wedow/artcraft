import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faArrowLeft, faCircleCheck } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ThirdPartyLinks } from "@storyteller/components/src/constants/ThirdPartyLinks";
import { DiscordLink2 } from "@storyteller/components/src/elements/DiscordLink2";
import { TwitterLink } from "@storyteller/components/src/elements/TwitterLink";
import { GetWebsiteLink } from "@storyteller/components/src/env/GetWebsiteLink";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Button, Container, Panel, SocialButton } from "components/common";
import React, { useEffect, useState } from "react";

export default function WaitlistSuccessPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const sharePath = "/";
  const shareUrl = GetWebsiteLink(sharePath);
  const shareText =
    "I just joined the waitlist for Storyteller Studio! Check out their site and join me in discovering the future of digital storytelling. 🌟";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  usePrefixedDocumentTitle("Next Steps");

  return (
    <>
      <Container
        type="panel"
        className="d-flex flex-column align-items-center mb-5"
        style={{ maxWidth: "880px" }}
      >
        <img
          src="/fakeyou/Storyteller-Logo-1.png"
          alt="Storyteller Logo"
          style={{ maxWidth: "280px" }}
          className="mb-4"
        />
        <div
          style={{
            backgroundColor: "#242433",
            borderRadius: "1rem",
            borderTop: "3px solid #e66462",
            paddingLeft: isMobile ? "1.5rem" : "3rem",
            paddingRight: isMobile ? "1.5rem" : "3rem",
          }}
          className="text-center d-flex flex-column gap-3 align-items-center py-3 w-100"
        >
          <h2 className="fw-bold mt-3">
            <FontAwesomeIcon icon={faCircleCheck} className="me-3" />
            You're on the waitlist!
          </h2>
          <div>
            <p className="fw-semibold lead text-white mb-1 fs-5">
              Thank you for your interest in Storyteller Studio.
            </p>
            <p>
              Meanwhile, please share us on social media and help us spread the
              word!
            </p>
          </div>
          <div className="d-flex flex-wrap gap-3 gap-lg-4 my-2 justify-content-between">
            <SocialButton
              social="x"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="reddit"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="facebook"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="whatsapp"
              shareUrl={shareUrl}
              shareText={shareText}
            />
            <SocialButton
              social="email"
              shareUrl={shareUrl}
              shareText={shareText}
            />
          </div>
          <p>
            If you have any questions, feel free to reach out to us at
            <br />
            <a
              href="mailto:support@storyteller.ai"
              style={{ color: "#e66462" }}
            >
              support@storyteller.ai
            </a>
          </p>
          <div className="d-flex justify-content-center my-3">
            <Button icon={faArrowLeft} to="/" label="Back to Homepage" />
          </div>
        </div>
      </Container>

      <Container type="panel" style={{ maxWidth: "880px" }}>
        <Panel padding={true} className="p-4 p-lg-5 rounded">
          <div className="d-flex flex-column gap-3 flex-lg-row align-items-center mb-5 text-center text-lg-start">
            <div>
              <h2 className="fw-bold mb-2">Join our Discord!</h2>
              <p className="fw-normal opacity-75">
                The fastest way to stay up to date is to join our{" "}
                <DiscordLink2 />. You might even be able to get early access
                &mdash; just ask!
              </p>
            </div>

            <div>
              <Button
                label="Join our Discord!"
                icon={faDiscord}
                className="enter-storyteller-button"
                href={ThirdPartyLinks.STORYTELLER_DISCORD}
              />
            </div>
          </div>
          <div className="row g-3">
            <div className="col-6 col-lg-4">
              <div className="w-100 h-100 rounded overflow-hidden">
                <img
                  src="https://storage.googleapis.com/vocodes-public/media/f/0/g/9/c/f0g9c1pqpa10hf6hbd3j8m7yzn8njh58/storyteller_f0g9c1pqpa10hf6hbd3j8m7yzn8njh58.mp4-thumb.gif"
                  alt="Fox Video"
                  className="w-100 object-fit-cover"
                />
              </div>
            </div>
            <div className="col-6 col-lg-4">
              <div className="w-100 h-100 rounded overflow-hidden">
                <img
                  src="https://storage.googleapis.com/vocodes-public/media/0/r/n/v/w/0rnvwqf7g7chkp3v4vnq5mgp0b2gpqcq/storyteller_0rnvwqf7g7chkp3v4vnq5mgp0b2gpqcq.mp4-thumb.gif"
                  alt="Dinosaur Video"
                  className="w-100 object-fit-cover"
                />
              </div>
            </div>
            <div className="col-6 col-lg-4">
              <div className="w-100 h-100 rounded overflow-hidden">
                <img
                  src="https://storage.googleapis.com/vocodes-public/media/8/s/a/k/x/8sakxqt1gtg4vanccf56ca7w9ez6bxr2/storyteller_8sakxqt1gtg4vanccf56ca7w9ez6bxr2.mp4-thumb.gif"
                  alt="Girl Video"
                  className="w-100 object-fit-cover"
                />
              </div>
            </div>
            <div className="col-6 col-lg-4 d-lg-none">
              <div className="w-100 h-100 rounded overflow-hidden">
                <img
                  src="https://storage.googleapis.com/vocodes-public/media/q/a/4/y/5/qa4y5dphdfvca3yqszp5wsqz5bzsce1n/videoqa4y5dphdfvca3yqszp5wsqz5bzsce1nmp4-thumb.gif"
                  alt="Portal Video"
                  className="w-100 object-fit-cover"
                />
              </div>
            </div>
          </div>
        </Panel>

        <br />

        <Panel padding={true} className="p-3 p-lg-4 rounded">
          <div className="flex-grow-1 text-center text-lg-start">
            <h2 className="fw-bold">Follow us too!</h2>

            <div>
              <TwitterLink />
            </div>
          </div>
        </Panel>
      </Container>
    </>
  );
}
