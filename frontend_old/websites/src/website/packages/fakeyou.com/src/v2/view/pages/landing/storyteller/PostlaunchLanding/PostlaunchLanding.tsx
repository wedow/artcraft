import {
  GetWebsite,
  Website,
} from "@storyteller/components/src/env/GetWebsite";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Button } from "components/common";
import React, { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import FeatureTitle from "./FeatureTitle";
import { FeatureVideo } from "./FeatureCard";
import {
  faArrowRight,
  faCube,
  faFaceViewfinder,
  faFilm,
  faMicrophoneLines,
  faPaintbrushPencil,
  faPersonRays,
  faPersonRunning,
  faRetweet,
} from "@fortawesome/pro-solid-svg-icons";
import ScrollingSceneCarousel from "./ScrollingSceneCarousel";
import EmailSignUp from "./EmailSignUp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useModal, useSession } from "hooks";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { isMobile as isMobileDevice } from "react-device-detect";

export default function PostlaunchLanding() {
  const { sessionWrapper } = useSession();
  const [imageHeight, setImageHeight] = useState("100vh");
  const domain = GetWebsite();
  const { open } = useModal();
  const openModal = () =>
    open({
      component: EmailSignUp,
      props: { mobile: true, showHanashi: false, handleClose: openModal },
    });

  const webpageTitle =
    domain.website === Website.FakeYou
      ? "FakeYou Celebrity Voice Generator"
      : "AI Creation Engine";

  usePrefixedDocumentTitle(webpageTitle);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 992);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const updateImageSize = () => {
      const headerHeight =
        document.querySelector(".header-container")?.clientHeight || 0;
      const topPadding = 20;
      const bottomPadding = 50;
      const windowHeight = window.innerHeight;
      const availableHeight =
        windowHeight - headerHeight - topPadding - bottomPadding;
      setImageHeight(`${availableHeight}px`);
    };

    window.addEventListener("resize", updateImageSize);

    updateImageSize();

    return () => window.removeEventListener("resize", updateImageSize);
  }, []);

  const [isSmallScreen, setIsSmallScreen] = useState(window.innerHeight > 1000);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerHeight > 1000);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  let scaleFactor;
  if (isSmallScreen) {
    scaleFactor = 3.5;
  } else {
    scaleFactor = 4.5;
  }

  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scaleFull = useTransform(scrollYProgress, [0, 1], [1, scaleFactor]);
  const opacityLaptop = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const opacityTitle = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const opacityOverlay = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

  const containerDiscord = useRef(null);
  const { scrollYProgress: scrollYProgress2 } = useScroll({
    target: containerDiscord,
    offset: ["-100vh", "100vh"],
  });

  const moveFirstUp = useTransform(scrollYProgress2, [0, 1], [0, -300]);
  const moveSecondDown = useTransform(scrollYProgress2, [0, 1], [-300, 100]);
  const moveThirdUp = useTransform(scrollYProgress2, [0, 1], [0, -300]);

  let ctaButton;

  if (sessionWrapper.canAccessStudio()) {
    // Logged in + can access studio
    ctaButton = (
      <>
        {isMobileDevice ? (
          <div className="d-flex">
            <Button
              label="Enter Storyteller Studio"
              className="mt-4"
              fontLarge={true}
              icon={faArrowRight}
              iconFlip={true}
              to="/studio-mobile-check"
            />
          </div>
        ) : (
          <div className="d-flex">
            <Button
              label="Enter Storyteller Studio"
              className="mt-4"
              fontLarge={true}
              icon={faArrowRight}
              iconFlip={true}
              href="https://studio.storyteller.ai/"
            />
          </div>
        )}
      </>
    );
  } else if (!sessionWrapper.isLoggedIn()) {
    // User is not logged in. For now, we can give them
    // immediate access if they sign up. This will only be a
    // brief state.
    ctaButton = (
      <div className="d-flex">
        <Button
          label="Sign Up for Studio"
          className="mt-4"
          fontLarge={true}
          icon={faArrowRight}
          iconFlip={true}
          href="/signup"
        />
      </div>
    );
  } else {
    // Logged in + cannot access studio - let's waitlist them
    // This is typically the default secondary state.
    ctaButton = <WaitlistHeroButton openModal={openModal} />;
  }

  return (
    <>
      {isMobile ? (
        // MOBILE VIEW
        <div className="container">
          <div
            className="header-container text-center d-flex flex-column align-items-center justify-content-center mb-5"
            style={{ paddingTop: "80px" }}
          >
            <h1 className="display-1 fw-bold mt-4" style={{ opacity: 0.9 }}>
              {firstTitle}
            </h1>
            <p className="lead fw-medium fs-4 opacity-75">{firstSubtext}</p>
            {ctaButton}
          </div>
          <div
            className="d-flex justify-content-center align-items-center position-relative"
            style={{
              width: "100%",
              zIndex: 10,
            }}
          >
            <video
              preload="metadata"
              style={{
                width: "100%",
                maxWidth: "900px",
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: "2px solid rgba(255, 255, 255, 0.1)",
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

          <div
            className="container d-flex flex-column text-center justify-content-center align-items-center w-100"
            style={{ marginBottom: "50px" }}
          >
            <div className="d-flex flex-column align-items-center">
              <h2 className="display-4 fw-bold mt-4">{secondTitle}</h2>
              <p className="lead fw-normal fs-5 opacity-75">{secondSubtext}</p>
            </div>
          </div>

          <div style={{ marginBottom: "60px" }}>
            <ScrollingSceneCarousel small={true} />
          </div>

          <div
            className="container d-flex flex-column text-center justify-content-center align-items-center w-100"
            style={{ marginBottom: "40px" }}
          >
            <div className="d-flex flex-column align-items-center">
              <h2 className="display-4 fw-bold mt-4">{thirdTitle}</h2>
              <p className="lead fw-normal fs-5 opacity-75">{thirdSubtext}</p>
            </div>
          </div>

          <div className="container d-flex flex-column gap-5">
            {features.map(feature => (
              <li key={feature.id} className="list-unstyled d-flex flex-column">
                <video
                  className="object-fit-contain w-100 h-100 mb-4"
                  preload="metadata"
                  muted={true}
                  autoPlay={true}
                  controls={false}
                  loop={true}
                  playsInline={true}
                  style={{ borderRadius: "1rem" }}
                >
                  <source src={feature.video} type="video/mp4" />
                </video>
                <h2 className="fs-2 fw-bold mb-3">
                  <FontAwesomeIcon icon={feature.icon} className="me-3" />
                  {feature.title}
                </h2>
                <p className="opacity-75 mb-5">{feature.description}</p>
              </li>
            ))}
          </div>

          <div
            className="container d-flex flex-column text-center justify-content-center align-items-center w-100"
            style={{ marginBottom: "40px", marginTop: "60px" }}
          >
            <div className="d-flex flex-column align-items-center">
              <h2 className="display-4 fw-bold mt-4">{fourthTitle}</h2>
              <p className="lead fw-normal fs-5 opacity-75">{fourthSubtext}</p>
            </div>
          </div>

          <div className="container d-flex flex-column gap-5">
            {features2.map(feature => (
              <li key={feature.id} className="list-unstyled d-flex flex-column">
                <video
                  className="object-fit-contain w-100 h-100 mb-4"
                  preload="metadata"
                  muted={true}
                  autoPlay={true}
                  controls={false}
                  loop={true}
                  playsInline={true}
                  style={{ borderRadius: "1rem" }}
                >
                  <source src={feature.video} type="video/mp4" />
                </video>
                <h2 className="fs-2 fw-bold mb-3">
                  <FontAwesomeIcon icon={feature.icon} className="me-3" />
                  {feature.title}
                </h2>
                <p className="opacity-75 mb-5">{feature.description}</p>
              </li>
            ))}
          </div>

          <div className="bg-panel rounded p-5 my-5">
            <div className="d-flex flex-column gap-3 align-items-center">
              <h2 className="fw-bold text-center">
                Become part of our creative community on Discord!
              </h2>
              <div className="d-flex">
                <Button
                  label="Join Discord Server"
                  icon={faDiscord}
                  variant="discord"
                  fontLarge={true}
                  href="https://discord.gg/storyteller"
                  target="_blank"
                />
              </div>
            </div>
          </div>

          <div
            className="container d-flex flex-column align-items-center"
            style={{ marginTop: "60px" }}
          >
            <h1 className="display-5 fw-bold">Showcase</h1>
            <p className="lead text-center fw-medium opacity-75 fs-5 mb-5">
              Videos created with Storyteller Studio.
            </p>
            <video
              poster="/images/landing/storyteller/Landing_Reel_Poster.png"
              preload="metadata"
              style={{
                width: "100%",
                maxWidth: "900px",
                borderRadius: "0.75rem",
                overflow: "hidden",
                border: "2px solid rgba(255, 255, 255, 0.1)",
              }}
              autoPlay={true}
              controls={false}
              muted={true}
              loop={true}
              playsInline={true}
            >
              <source src="/videos/landing/landing_reel.mp4" type="video/mp4" />
            </video>
            {sessionWrapper.isLoggedIn() && ctaButton}
          </div>

          {!sessionWrapper.canAccessStudio() ? (
            <div style={{ marginTop: "100px" }}>
              <EmailSignUp mobile={true} showHanashi={false} />
            </div>
          ) : null}
        </div>
      ) : (
        // DESKTOP VIEW
        <div>
          <div
            ref={container}
            style={{
              height: "150vh",
              position: "relative",
            }}
          >
            <div
              className="vh-100 w-100"
              style={{ position: "sticky", top: 0, overflow: "hidden" }}
            >
              <motion.div
                className="header-container text-center d-flex flex-column align-items-center justify-content-center"
                style={{ paddingTop: "50px", opacity: opacityTitle }}
              >
                <h1 className="display-1 fw-bold mt-4">{firstTitle}</h1>
                <p className="lead fw-medium fs-4" style={{ opacity: 0.9 }}>
                  {firstSubtext}
                </p>
                {ctaButton}
              </motion.div>
              <div
                style={{
                  flexGrow: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "32px 0",
                }}
              >
                <motion.div
                  className="d-flex justify-content-center align-items-center position-relative"
                  style={{
                    width: "100%",
                    maxHeight: imageHeight,
                    scale: scaleFull,
                    zIndex: 10,
                  }}
                >
                  <video
                    className="position-absolute"
                    preload="metadata"
                    style={{
                      height: "52%",
                      top: "20.55%",
                      zIndex: 10,
                      borderRadius: "0.25rem",
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
                  <motion.div
                    className="position-absolute"
                    style={{
                      width: "40%",
                      height: "52%",
                      top: "20.55%",
                      zIndex: 11,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      opacity: opacityOverlay,
                      borderRadius: "0.25rem",
                    }}
                  />
                  <motion.img
                    src="/images/landing/storyteller/Laptop_Storyteller_2.png"
                    alt="Laptop"
                    style={{
                      maxHeight: imageHeight,
                      objectFit: "contain",
                      width: "auto",
                      opacity: opacityLaptop,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                </motion.div>
              </div>
            </div>
            <div
              className="position-absolute w-100"
              style={{ bottom: isSmallScreen ? "240px" : "150px" }}
            >
              <div className="d-flex flex-column justify-content-center align-items-center w-100">
                <div>
                  <h2
                    className="display-4 fw-bold mt-4"
                    style={{ textShadow: "2px 2px 10px rgba(0, 0, 0, 0.3)" }}
                  >
                    {secondTitle}
                  </h2>
                  <p
                    className="lead fw-medium fs-5 opacity-75"
                    style={{ textShadow: "2px 2px 10px rgba(0, 0, 0, 0.3)" }}
                  >
                    {secondSubtext}
                  </p>
                  {ctaButton}
                </div>
              </div>
            </div>
          </div>

          {/* SCENE CAROUSEL SECTION */}
          <ScrollingSceneCarousel />

          <div className="container">
            <div className="text-center">
              <h1 className="fw-bold display-4" style={{ marginTop: "140px" }}>
                {thirdTitle}
              </h1>
              <p
                className="lead fw-medium opacity-75 fs-4"
                style={{ marginBottom: !isSmallScreen ? "-10%" : "-22%" }}
              >
                {thirdSubtext}
              </p>
            </div>

            {/* Steps of video creation */}
            <div
              className="d-flex w-100 align-items-start"
              style={{ gap: "40px" }}
            >
              <div className="w-100">
                <ul
                  className="list-unstyled"
                  style={{ paddingTop: "50vh", paddingBottom: "33vh" }}
                >
                  {features.map(feature => (
                    <li key={feature.id}>
                      <FeatureTitle
                        id={feature.id}
                        title={feature.title}
                        icon={feature.icon}
                        description={feature.description}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="w-100 position-sticky top-0 d-flex align-items-center justify-content-center"
                style={{ height: "100vh", marginTop: "120px" }}
              >
                <div
                  className="ratio ratio-1x1"
                  style={{
                    width: !isSmallScreen ? "600px" : "650px",
                    backgroundColor: "#242433",
                    borderRadius: "1rem",
                  }}
                >
                  {features.map(feature => (
                    <feature.card
                      id={feature.id}
                      key={feature.id}
                      video={feature.video}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <h1
                className="fw-bold display-4"
                style={{ marginTop: !isSmallScreen ? "-40px" : "-120px" }}
              >
                {fourthTitle}
              </h1>
              <p
                className="lead fw-medium opacity-75 fs-4"
                style={{ marginBottom: !isSmallScreen ? "-10%" : "-22%" }}
              >
                {fourthSubtext}
              </p>
            </div>

            {/* More features */}
            <div
              className="d-flex w-100 align-items-start flex-row-reverse"
              style={{ gap: "40px" }}
            >
              <div className="w-100">
                <ul
                  className="list-unstyled"
                  style={{ paddingTop: "50vh", paddingBottom: "33vh" }}
                >
                  {features2.map(feature => (
                    <li key={feature.id}>
                      <FeatureTitle
                        id={feature.id}
                        title={feature.title}
                        icon={feature.icon}
                        description={feature.description}
                        position="right"
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="w-100 position-sticky top-0 d-flex align-items-center justify-content-center"
                style={{ height: "100vh", marginTop: "120px" }}
              >
                <div
                  className="ratio ratio-1x1"
                  style={{
                    width: !isSmallScreen ? "600px" : "650px",
                    backgroundColor: "#242433",
                    borderRadius: "1rem",
                  }}
                >
                  {features2.map(feature => (
                    <feature.card
                      id={feature.id}
                      key={feature.id}
                      video={feature.video}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="w-100 bg-panel overflow-hidden"
            style={{ marginTop: !isSmallScreen ? "0px" : "-100px" }}
          >
            <div
              className="container"
              style={{ width: "1300px" }}
              ref={containerDiscord}
            >
              <div className="row">
                <div
                  className="col-12 col-lg-6"
                  style={{ paddingTop: "100px", paddingBottom: "100px" }}
                >
                  <div className="d-flex flex-column gap-4">
                    <h1 className="fw-bold" style={{ width: "600px" }}>
                      Become part of our creative community on Discord!
                    </h1>
                    <div className="d-flex">
                      <Button
                        label="Join Discord Server"
                        icon={faDiscord}
                        variant="discord"
                        fontLarge={true}
                        href="https://discord.gg/storyteller"
                        target="_blank"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-6 position-relative">
                  <motion.div className="w-100 d-flex gap-4 position-absolute justify-content-center">
                    <motion.img
                      style={{ y: moveFirstUp }}
                      src="/images/discord-pfp/discord-1.png"
                      alt="discord 1"
                    />
                    <motion.img
                      style={{ y: moveSecondDown }}
                      src="/images/discord-pfp/discord-2.png"
                      alt="discord 2"
                    />
                    <motion.img
                      style={{ y: moveThirdUp }}
                      src="/images/discord-pfp/discord-3.png"
                      alt="discord 3"
                    />
                  </motion.div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      height: "160px",
                      width: "100%",
                      backgroundImage:
                        "linear-gradient(to top, #262636, rgba(255,255,255,0)",
                      backgroundPosition: "bottom center",
                      backgroundRepeat: "no-repeat",
                      zIndex: 10,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="container d-flex flex-column align-items-center"
            style={{ marginTop: !isSmallScreen ? "100px" : "100px" }}
          >
            <h1 className="display-5 fw-bold">Showcase</h1>
            <p className="lead fw-medium opacity-75 fs-4 mb-5">
              Videos created with Storyteller Studio.
            </p>
            <video
              poster="/images/landing/storyteller/Landing_Reel_Poster.png"
              preload="metadata"
              style={{
                width: "100%",
                maxWidth: "900px",
                borderRadius: "1rem",
                overflow: "hidden",
                border: "2px solid rgba(255, 255, 255, 0.1)",
              }}
              autoPlay={true}
              controls={false}
              muted={true}
              loop={true}
              playsInline={true}
            >
              <source src="/videos/landing/landing_reel.mp4" type="video/mp4" />
            </video>
            {sessionWrapper.isLoggedIn() && ctaButton}
          </div>

          <div className="container">
            {!sessionWrapper.canAccessStudio() ? (
              <div style={{ marginTop: "260px" }}>
                <EmailSignUp />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

interface WaitlistHeroButtonProps {
  openModal: () => void;
}

function WaitlistHeroButton(props: WaitlistHeroButtonProps) {
  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <Button
          label="Join the Waitlist"
          className="mt-4"
          fontLarge={true}
          icon={faArrowRight}
          iconFlip={true}
          onClick={props.openModal}
        />
      </div>

      <div className="d-flex align-items-center fs-7 gap-1">
        <span className="opacity-75">Have a beta key?</span>
        <Button
          label="Redeem now!"
          variant="link"
          fontLarge={true}
          className="fs-7"
          to="/beta-key/redeem"
        />
      </div>
    </div>
  );
}

//const firstTitle = "Control Your Movie";
const firstTitle = "Controllable AI Animation";
//"Effortlessly create your movie in any style you want with AI.";
const firstSubtext = "We're the first completely-digital AI Film Studio";
const secondTitle = "Your AI 3D Creation Engine";
const secondSubtext =
  "Build the worlds you want instead of prompting and relying on serendipity.";
const thirdTitle = "A Film Studio in Your Hands";
const thirdSubtext = "Build Worlds and Make Films With Just Your Computer";
const fourthTitle = "Artist in the Loop";
const fourthSubtext = "AI is a tool in the creative toolkit.";

const features = [
  {
    title: "Build your 3D scene",
    icon: faCube,
    description:
      "Storyteller Studio allows you to create and customize your 3D environment. Add characters, objects, and fine-tune details to craft the perfect scene for your movie.",
    id: "build-scene",
    card: FeatureVideo,
    video: "/videos/landing/build_scene.mp4",
  },
  {
    title: "Animate your scene",
    icon: faPersonRunning,
    description:
      "Bring your scene to life by adding animations to your characters and objects. Control movements to create dynamic visuals that engage your audience.",
    id: "animate-scene",
    card: FeatureVideo,
    video: "/videos/landing/animate_scene.mp4",
  },
  {
    title: "Select a style",
    icon: faPaintbrushPencil,
    description:
      "Choose from a variety of artistic styles to transform your 3D scene. Whether you prefer a realistic look or a more abstract approach, our AI can apply the style seamlessly.",
    id: "select-style",
    card: FeatureVideo,
    video: "/videos/landing/select_style.mp4",
  },
  {
    title: "Generate your movie",
    icon: faFilm,
    description:
      "Let Storyteller Studio's AI process your scene and selected style to produce a stunning video. Sit back and watch as your 3D creation comes to life with the chosen visual art style.",
    id: "generate-movie",
    card: FeatureVideo,
    video: "/videos/landing/generate_movie.mp4",
  },
  {
    title: "Share and remix",
    icon: faRetweet,
    description:
      "Share your results, scenes, assets, fine tuned ML models, and more with the community. Remix others' creations to enhance your own projects and inspire new ideas.",
    id: "share-and-remix",
    card: FeatureVideo,
    video: "/videos/landing/share_remix.mp4",
  },
];

const features2 = [
  {
    title: "Facial mocap",
    icon: faFaceViewfinder,
    description:
      "Record your facial expressions and use them in your scene. Our facial mocap feature ensures your characters mimic your emotions.",
    id: "facial-mocap",
    card: FeatureVideo,
    video: "/videos/landing/facial_mocap.mp4",
  },
  {
    title: "Body mocap",
    icon: faPersonRays,
    description:
      "Capture full-body movements and apply them to your characters. Body mocap allows for realistic and fluid character animations.",
    id: "body-mocap",
    card: FeatureVideo,
    video: "/videos/landing/body_mocap.mp4",
  },
  {
    title: "Voice conversion",
    icon: faMicrophoneLines,
    description:
      "Record your own voice and transform it into a character's voice. Choose from thousands of voice options to match your character perfectly.",
    id: "voice-conversion",
    card: FeatureVideo,
    video: "/videos/landing/voice_conversion.mp4",
  },
];
