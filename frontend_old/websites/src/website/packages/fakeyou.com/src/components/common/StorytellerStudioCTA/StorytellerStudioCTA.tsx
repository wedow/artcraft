import React from "react";
import Button from "../Button";
import { faArrowRight, faCube } from "@fortawesome/pro-solid-svg-icons";
// import useModal from "hooks/useModal";
// import EmailSignUp from "v2/view/pages/landing/storyteller/PostlaunchLanding/EmailSignUp";
import ScrollingSceneCarousel from "v2/view/pages/landing/storyteller/PostlaunchLanding/ScrollingSceneCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Panel from "../Panel";
import { get } from "local-storage";

interface StorytellerStudioCTAProps {
  showButton?: boolean;
  showIcon?: boolean;
  subText?: string;
  title?: string;
  showMarquee?: boolean;
}

const StorytellerStudioCTA = ({
  showButton = true,
  subText,
  title,
  showMarquee = true,
  showIcon = true,
}: StorytellerStudioCTAProps) => {
  // const { open } = useModal();
  // const openModal = () =>
  //   open({
  //     component: EmailSignUp,
  //     props: { mobile: true, showHanashi: false,
  //       handleClose: openModal
  //     },
  //   });

  return (
    <Panel className="pb-5 pt-3 pt-lg-0">
      <div className="row py-3 pb-0 px-4 px-lg-5 py-lg-0 g-3 gx-lg-5">
        <div className="col-12 col-lg-6 pb-lg-3 d-flex flex-column justify-content-center ps-lg-5">
          <h1 className="fw-bold mb-3 text-center text-lg-start">
            {showIcon && (
              <FontAwesomeIcon icon={faCube} className="fs-2 me-3" />
            )}
            {title ? title : "Storyteller Studio"}
          </h1>
          <p className="opacity-75 text-center text-lg-start">
            {subText
              ? subText
              : "Turn your creative ideas into stunning videos, by simply building a 3D scene and generate. Take full control of your creation and bring your story to life with Storyteller Studio!"}
          </p>
          {showButton && (
            <div className="d-flex justify-content-center justify-content-lg-start gap-3 mt-4">
              {!get<boolean>("firstFormIsSubmitted") ||
              !get<boolean>("secondFormIsSubmitted") ? (
                <>
                  {!get<boolean>("firstFormIsSubmitted") ? (
                    // <Button
                    //   label="Join the Waitlist"
                    //   icon={faArrowRight}
                    //   iconFlip={true}
                    //   onClick={openModal}
                    // />
                    <Button
                      label="Go to Storyteller"
                      icon={faArrowRight}
                      iconFlip={true}
                      href="https://storyteller.ai/"
                    />
                  ) : (
                    <Button
                      label="Get Access Sooner"
                      icon={faArrowRight}
                      iconFlip={true}
                      to="/creator-onboarding"
                    />
                  )}
                </>
              ) : (
                <Button
                  label="Visit Storyteller.ai"
                  icon={faArrowRight}
                  iconFlip={true}
                  href="https://storyteller.ai/"
                />
              )}
            </div>
          )}
        </div>
        <div className="col-12 col-lg-6 d-flex flex-column justify-content-center">
          <div
            className="overflow-hidden"
            style={{
              height: "80%",
              borderRadius: "0.75rem",
              border: "2px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <video
              className="ratio-16x9"
              preload="metadata"
              style={{
                width: "100%",
                objectFit: "cover",
                marginTop: "-6%",
                overflow: "hidden",
              }}
              autoPlay={true}
              controls={false}
              muted={true}
              loop={true}
              playsInline={true}
            >
              <source
                src="/videos/landing/hero_landing_video.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </div>
      {showMarquee && (
        <>
          <div className="d-none d-lg-block">
            <ScrollingSceneCarousel showGradient={false} />
          </div>
          <div className="d-block d-lg-none">
            <ScrollingSceneCarousel showGradient={false} small={true} />
          </div>
        </>
      )}
    </Panel>
  );
};

export default StorytellerStudioCTA;
