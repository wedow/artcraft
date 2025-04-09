import React, { useState } from "react";
import Marquee from "react-fast-marquee";
import "tippy.js/dist/tippy.css";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination, FreeMode, Navigation, Thumbs } from "swiper";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

function IndexPage() {
  // NB: React video bug:
  // https://stackoverflow.com/questions/61510160/why-muted-attribute-on-video-tag-is-ignored-in-react
  // https://stackoverflow.com/questions/61510160/why-muted-attribute-on-video-tag-is-ignored-in-react
  const videoRefMain: any = useRef(null);
  const videoRef1: any = useRef(null);
  const videoRef2: any = useRef(null);
  const videoRef3: any = useRef(null);
  const videoRef4: any = useRef(null);

  // Title Animation
  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.to(
      "#hero-title",
      {
        delay: 0,
        duration: 0.8,
        x: 0,
        scale: 1,
        opacity: 1,
        ease: "expo",
      },
      "<"
    );
    tl.to(
      "#sub-title",
      {
        delay: 0,
        duration: 0.8,
        x: 0,
        scale: 1,
        opacity: 1,
        ease: "expo",
      },
      "<"
    );
    tl.to(
      "#hero-btn",
      {
        delay: 0,
        duration: 0.8,
        x: 0,
        scale: 1,
        opacity: 1,
        ease: "expo",
      },
      "<"
    );
  }, []);

  useEffect(() => {
    if (!!videoRefMain.current) {
      videoRefMain.current.setAttribute("muted", "true");
      videoRefMain.current.setAttribute("autoplay", "true");
      videoRefMain.current.setAttribute("loop", "true");
      videoRefMain.current.setAttribute("playsinline", "true");
      videoRefMain.current.setAttribute("disablepictureinpicture", "true");
      videoRefMain.current.setAttribute("preload", "auto");
      videoRefMain.current.muted = true;
      videoRefMain.current.play();
    }
  }, [videoRefMain]);

  useEffect(() => {
    if (!!videoRef1.current) {
      videoRefMain.current.setAttribute("muted", "true");
      videoRefMain.current.setAttribute("autoplay", "true");
      videoRefMain.current.setAttribute("loop", "true");
      videoRefMain.current.setAttribute("playsinline", "true");
      videoRefMain.current.setAttribute("disablepictureinpicture", "true");
      videoRefMain.current.setAttribute("preload", "auto");
      videoRefMain.current.muted = true;
      videoRefMain.current.play();
    }
  }, [videoRef1]);

  useEffect(() => {
    if (!!videoRef2.current) {
      videoRef2.current.setAttribute("muted", "true");
      videoRef2.current.setAttribute("autoplay", "true");
      videoRef2.current.setAttribute("loop", "true");
      videoRef2.current.setAttribute("playsinline", "true");
      videoRef2.current.setAttribute("disablepictureinpicture", "true");
      videoRef2.current.setAttribute("preload", "auto");
      videoRef2.current.muted = true;
      videoRef2.current.play();
    }
  }, [videoRef2]);

  useEffect(() => {
    if (!!videoRef3.current) {
      videoRef3.current.setAttribute("muted", "true");
      videoRef3.current.setAttribute("autoplay", "true");
      videoRef3.current.setAttribute("loop", "true");
      videoRef3.current.setAttribute("playsinline", "true");
      videoRef3.current.setAttribute("disablepictureinpicture", "true");
      videoRef3.current.setAttribute("preload", "auto");
      videoRef3.current.muted = true;
      videoRef3.current.play();
    }
  }, [videoRef3]);

  useEffect(() => {
    if (!!videoRef4.current) {
      videoRef4.current.setAttribute("muted", "true");
      videoRef4.current.setAttribute("autoplay", "true");
      videoRef4.current.setAttribute("loop", "true");
      videoRef4.current.setAttribute("playsinline", "true");
      videoRef4.current.setAttribute("disablepictureinpicture", "true");
      videoRef4.current.setAttribute("preload", "auto");
      videoRef4.current.muted = true;
      videoRef4.current.play();
    }
  }, [videoRef4]);

  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  const teamMembers = [
    {
      name: "Ozzy",
      role: "Machine Learning Engineer",
      imageSrc: "/images/team/ozzy.webp",
    },
    {
      name: "Michael",
      role: "Machine Learning Engineer",
      imageSrc: "/images/team/michael.webp",
    },
    {
      name: "Ramiro",
      role: "Machine Learning Engineer",
      imageSrc: "/images/team/ramiro.webp",
    },
    {
      name: "Scott",
      role: "CCO / Technical 3D Artist",
      imageSrc: "/images/team/scott.webp",
    },
    {
      name: "Bombay",
      role: "UI / Frontend Engineer",
      imageSrc: "/images/team/bombay.webp",
    },
    {
      name: "Paul",
      role: "Systems Engineer",
      imageSrc: "/images/team/paul.webp",
    },
    {
      name: "Jose",
      role: "Data Team",
      imageSrc: "/images/team/jose.webp",
    },
    {
      name: "Rodrigo",
      role: "Data Team",
      imageSrc: "/images/team/rodrigo.webp",
    },
  ];

  return (
    <div data-scroll-section data-scroll-repeat="true">
      <div
        id="home"
        className="bg-hero"
        data-scroll
        data-scroll-repeat="true"
        data-scroll-call="home"
      >
        {/* <video className="bg-video" ref={videoRefBG}>
          <source src="/hero/bg-video.mp4" type="video/mp4"></source>
        </video> */}

        <div className="container pt-5">
          <div className="d-flex flex-column mt-5 pt-3 pt-lg-5 align-items-center text-center gap-3 mb-3">
            <h1 id="hero-title" className="hero-title text-center">
              <span className="hero-title-one align-items-center zi-2">
                Enabling Anyone to Create High Quality Movies and Music with AI
              </span>
            </h1>
            <p id="sub-title" className="hero-sub-title">
              We are combining generative AI and User Generated Content to
              radically democratize both audio and video production.
            </p>
            <div id="hero-btn" className="d-flex gap-3">
              <a
                className="btn btn-primary d-inline-flex"
                href="#vision"
                data-scroll-to
              >
                <span>Explore Storyteller</span>
              </a>
            </div>
          </div>

          <div className="pt-5 d-flex justify-content-center video-bottom">
            <div className="ratio ratio-16x9 hero-video-container">
              <div className="hero-video">
                <video ref={videoRefMain}>
                  <source
                    src="/hero/storyteller-hero.mp4"
                    type="video/mp4"
                  ></source>
                </video>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="vision" className="bg-light section-2">
        <div>
          <Marquee gradient={false} speed={100}>
            <h1 className="marquee-title d-flex gap-3 gap-md-4 gap-lg-5 mt-0 mb-lg-5">
              <span>Mission</span>
              <span className="text-red">\</span>
              <span className="text-outline">Mission</span>
              <span className="text-red">\</span>
              <span>Mission</span>
              <span className="text-red">\</span>
              <span className="text-outline">Mission</span>
              <span className="text-red">\</span>
              <span>Mission</span>
              <span className="text-red">\</span>
              <span className="text-outline">Mission</span>
              <span className="text-red me-3 me-md-4 me-lg-5">\</span>
            </h1>
          </Marquee>
        </div>

        <div className="container py-5 text-center d-flex flex-column align-items-center mt-3">
          <img src="/images/vision.webp" className="mb-4" alt="" width={325} />
          <h1 className="fw-bold display-6 about-title mt-4 px-lg-5">
            We’re building a future where individual creators can make content
            that rivals modern Hollywood studios
          </h1>
          <hr className="p-1 mt-5 mb-5 text-red opacity-100 w-25" />
          <div className="panel p-4 p-lg-5 d-flex justify-content-center about-title">
            <p className="fs-5 mb-0">
              “A future where more media is generated every single day than in
              all of previous human history. Where the technical mastery behind
              creativity becomes so accessible, that even a child could create a
              masterpiece.”
            </p>
          </div>
        </div>
      </div>

      <div id="products" className="bg-light section-2">
        <div>
          <Marquee gradient={false} speed={100}>
            <h1 className="marquee-title d-flex gap-3 gap-md-4 gap-lg-5 mt-0 mb-lg-5">
              <span>FakeYou</span>
              <span className="text-red">\</span>
              <span className="text-outline">FakeYou</span>
              <span className="text-red">\</span>
              <span>FakeYou</span>
              <span className="text-red">\</span>
              <span className="text-outline">FakeYou</span>
              <span className="text-red me-3 me-md-4 me-lg-5">\</span>
            </h1>
          </Marquee>
        </div>
        <div className="container mt-5 pt-5">
          <div className="row gx-5 flex-row-reverse gy-5">
            <div className="col-lg-6">
              <img
                src="/images/screenshots/fakeyou-tts-screen.webp"
                alt="FakeYou"
                className="img-fluid rounded border-frame"
              />
            </div>

            <div className="col-lg-6 d-flex flex-column justify-content-center">
              <h1 className="fw-bold ">Text to Speech</h1>
              <h4 className="fw-normal opacity-75 mb-4">
                Our flagship, launched in April, 2022
              </h4>
              <ul>
                <li>
                  Type in text, and get an audio recording of a selected voice
                </li>
                <li>
                  Over 3,000 user-generated voices of celebrities, characters
                  from film/television, and musicians
                </li>
                <li>
                  Users have created new episodes of their favorite cartoons,
                  taught classroom lessons on history, and made brand new music
                </li>
              </ul>
              <div>
                <a
                  href="https://fakeyou.com"
                  rel="noreferrer"
                  target="_blank"
                  className="btn btn-primary mt-4"
                >
                  <span>Visit FakeYou.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-dark section-2">
        <div className="container">
          <div className="row gx-5 gy-5">
            <div className="col-lg-6">
              <img
                src="/images/screenshots/fakeyou-v2v-screen.webp"
                alt="FakeYou"
                className="img-fluid rounded border-frame"
              />
            </div>

            <div className="col-lg-6 d-flex flex-column justify-content-center">
              <h1 className="fw-bold ">Voice to Voice</h1>
              <h4 className="fw-normal opacity-75 mb-4">
                Launched in April, 2023
              </h4>
              <ul>
                <li>
                  Upload an audio recording of speech, and transform the voice
                  into someone else
                </li>
                <li>
                  Rapidly growing library of voices supported by our community
                </li>
                <li>Supported by our success TTS engine</li>
              </ul>
              <div>
                <a
                  href="https://fakeyou.com/"
                  rel="noreferrer"
                  target="_blank"
                  className="btn btn-primary mt-4"
                >
                  <span>Visit FakeYou.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="bg-light section-2">
        <div className="container">
          <div className="row gx-5 flex-row-reverse gy-5">
            <div className="col-lg-6">
              <img
                src="/images/screenshots/fakeyou-v2v-screen.webp"
                alt="FakeYou"
                className="img-fluid rounded border-frame"
              />
            </div>

            <div className="col-lg-6 d-flex flex-column justify-content-center">
              <h1 className="fw-bold ">Video Lip Sync</h1>
              <h4 className="fw-normal opacity-75 mb-4">
                Launched in April 2022
              </h4>
              <ul>
                <li>
                  Upload an audio recording of speech, and an image and generate
                  animation of a character speaking
                </li>
              </ul>
              <div>
                <a
                  href="https://fakeyou.com/"
                  rel="noreferrer"
                  target="_blank"
                  className="btn btn-primary mt-4"
                >
                  <span>Visit FakeYou.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div
        id="research"
        className="bg-dark section-2"
        data-scroll
        data-scroll-repeat="true"
        data-scroll-call="research"
      >
        <Marquee gradient={false} speed={100}>
          <h1 className="marquee-title d-flex gap-3 gap-md-4 gap-lg-5 mt-0 mb-lg-5">
            <span className="text-outline">Research</span>
            <span className="text-red">\</span>
            <span>Research</span>
            <span className="text-red">\</span>
            <span className="text-outline">Research</span>
            <span className="text-red">\</span>
            <span>Research</span>
            <span className="text-red me-3 me-md-4 me-lg-5">\</span>
          </h1>
        </Marquee>

        <div className="container pt-5 text-center d-flex flex-column align-items-center">
          <h1 className="fw-bold display-4 about-title mt-5">
            Storyteller Labs
          </h1>
          <h4 className="fw-normal opacity-75 mt-2 lh-base">
            We’re building sophisticated animation capabilities for both AI and
            human actors
          </h4>
        </div>

        {/* <div className="about-cards-container mt-4 mb-5">
          <div className="container text-center d-flex flex-column align-items-center">
            <div className="row gx-4 gy-5 pt-4 position-relative">
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon icon={faCube} className="about-icon" />
                  Blended 3D upscaling and style transfer to achieve any look
                  &mdash; real or animated
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon icon={faUserCowboy} className="about-icon" />
                  Cooperative AI actors that can interact with humans and each
                  other
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon
                    icon={faPersonWalkingArrowRight}
                    className="about-icon"
                  />
                  Motion and animation generation
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon
                    icon={faPaintbrushPencil}
                    className="about-icon"
                  />
                  Graphical, procedural, and AI-assisted worldbuilding
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon icon={faBookOpen} className="about-icon" />
                  Script writing, narrative construction, and tonal editor
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon icon={faPaintbrush} className="about-icon" />
                  Concept art and storyboard generation
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon icon={faDrum} className="about-icon" />
                  Automatic foley and soundtracks
                </p>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <p className="fw-normal card bg-dark-solid pt-5 about-card">
                  <FontAwesomeIcon
                    icon={faClapperboard}
                    className="about-icon"
                  />
                  High level, fast, and intuitive production
                </p>
              </div>
            </div>
          </div>
        </div> */}

        <div className="container pb-lg-5 mb-lg-5">
          <div className="research-swiper">
            <div className="row gy-0">
              <div className="col-12 col-lg-4">
                <Swiper
                  onSwiper={(swiper: any) => setThumbsSwiper(swiper)}
                  loop={false}
                  direction="vertical"
                  slidesPerView={4}
                  spaceBetween={16}
                  freeMode={true}
                  watchSlidesProgress={true}
                  modules={[FreeMode, Navigation, Thumbs]}
                  allowTouchMove={false}
                  preventInteractionOnTransition={true}
                  className="research-swiper-thumb-container"
                >
                  <SwiperSlide>Facial Tracking</SwiperSlide>
                  <SwiperSlide>Motion Capture</SwiperSlide>
                  <SwiperSlide>AI-Powered Automated Lip-syncing</SwiperSlide>
                  <SwiperSlide>GPT-Driven 24-hour News Cycle</SwiperSlide>
                </Swiper>
              </div>
              <div className="col-12 col-lg-8">
                <Swiper
                  loop={true}
                  navigation={false}
                  thumbs={{ swiper: thumbsSwiper }}
                  modules={[FreeMode, Navigation, Thumbs]}
                  className="research-swiper-video-container"
                >
                  <SwiperSlide>
                    <div className="ratio ratio-16x9">
                      <video
                        src="/video/Facetrack.mp4"
                        ref={videoRef1}
                        autoPlay
                        muted
                        loop
                      ></video>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="ratio ratio-16x9">
                      <div className="ratio ratio-16x9">
                        <video
                          src="/video/Mocap.mp4"
                          ref={videoRef2}
                          autoPlay
                          muted
                          loop
                        ></video>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="ratio ratio-16x9">
                      <div className="ratio ratio-16x9">
                        <video
                          src="/video/Automatic-Lipsync.mp4"
                          ref={videoRef3}
                          autoPlay
                          muted
                          loop
                        ></video>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="ratio ratio-16x9">
                      <div className="ratio ratio-16x9">
                        <video
                          src="/video/News.mp4"
                          ref={videoRef4}
                          autoPlay
                          muted
                          loop
                        ></video>
                      </div>
                    </div>
                  </SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="bg-hero-2">
        <div className="d-flex justify-content-center">

          <div
            className="hero-img roko"
            data-scroll
            data-scroll-speed="1"
            data-scroll-direction="horizontal"
          >
            <img
              id="roko"
              src="/hero/hyperjail_IsolatedRoko_RimWEB.png"
              alt=""
            />
          </div>

          <div
            className="hero-img basilisk"
            data-scroll
            data-scroll-speed="-1"
            data-scroll-direction="horizontal"
          >
            <img
              id="basilisk"
              src="/hero/hyperjail_IsolatedBasilisk_RimWEB.png"
              alt=""
            />
          </div>

          <div
            className="hero-img pascal"
            data-scroll
            data-scroll-speed="1"
            data-scroll-direction="vertical"
          >
            <img
              id="pascal"
              src="/hero/hyperjail_IsolatedPascal_RimWEB.png"
              alt=""
            />
          </div>

          <div className="bg-floor"></div>
        </div>

        <div
          className="d-none d-lg-flex social-icons flex-column gap-4 align-items-center"
          data-scroll
          data-scroll-speed="8"
          data-scroll-direction="horizontal"
          data-scroll-position="top"
        >
          <Tippy content="Discord" placement="right">
            <a
              href={ThirdPartyLinks.FAKEYOU_DISCORD}
              rel="noreferrer"
              target="_blank"
            >
              <FontAwesomeIcon icon={faDiscord} />
            </a>
          </Tippy>
          <Tippy content="Twitch" placement="right">
            <a
              href="https://twitch.tv/FakeYouLabs"
              rel="noreferrer"
              target="_blank"
            >
              <FontAwesomeIcon icon={faTwitch} />
            </a>
          </Tippy>
          <Tippy content="Facebook" placement="right">
            <a
              href="https://facebook.com/vocodes"
              rel="noreferrer"
              target="_blank"
            >
              <FontAwesomeIcon icon={faFacebook} />
            </a>
          </Tippy>
          <Tippy content="Twitter" placement="right">
            <a
              href="https://twitter.com/intent/follow?screen_name=FakeYouApp"
              rel="noreferrer"
              target="_blank"
            >
              <FontAwesomeIcon icon={faTwitter} />
            </a>
          </Tippy>
        </div>

        <div className="shape-2 d-none d-lg-block"></div>
        <div
          className="shape-3-container d-none d-lg-block"
          data-scroll
          data-scroll-speed="3"
        >
          <div className="shape-3"></div>
        </div>

        <div
          className="shape-1-container d-none d-lg-block"
          data-scroll
          data-scroll-speed="3"
        >
          <div className="shape-1"></div>
        </div>

        <div
          className="shape-4-container d-none d-lg-block"
          data-scroll
          data-scroll-speed="2"
        >
          <div className="shape-4"></div>
        </div>
      </div> */}

      <div id="team" className="bg-light section-2">
        <div>
          <Marquee gradient={false} speed={120}>
            <h1 className="marquee-title d-flex gap-3 gap-md-4 gap-lg-5 mt-0 mb-lg-5">
              <span className="text-outline">Our Team</span>
              <span className="text-red">\</span>
              <span>Our Team</span>
              <span className="text-red">\</span>
              <span className="text-outline">Our Team</span>
              <span className="text-red">\</span>
              <span>Our Team</span>
              <span className="text-red me-3 me-md-4 me-lg-5">\</span>
            </h1>
          </Marquee>
        </div>

        <div className="container py-5 mt-5">
          <div className="row g-4 g-md-5 align-items-center">
            <div className="col-12 col-md-6">
              <div>
                <h1 className="fw-bold display-6 about-title">
                  We’re an interdisciplinary team building the one-person cloud
                  studio
                </h1>
                <hr className="p-1 mt-4 text-red opacity-100 w-25" />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <p className="fw-normal opacity-75 mb-0">
                Our mission is to empower anyone to create full feature-length
                content from home without institutional capital, large teams,
                huge amounts of time, or deep reservoirs of highly specialized
                talent. We give everyone their turn in the director’s seat and
                turn dreams into physical form.
              </p>
            </div>
          </div>
        </div>

        <div className="container mt-md-5">
          <h1 className="mb-4">The Team</h1>

          <div className="panel">
            <div className="row g-4 g-md-5">
              <div className="col-6 col-md-3 mb-0">
                <img
                  src="/images/team/brandon.webp"
                  className="img-fluid img-team img-brandon"
                  alt=""
                />
              </div>
              <div className="col-12 col-md-9 text-start d-flex flex-column justify-content-center">
                <div className="p-3 ps-md-0">
                  <p className="fw-semibold opacity-100 mb-0 fs-5">
                    Brandon Thomas
                  </p>
                  <p className="team-role-text">Founder and CEO</p>
                  <hr className="my-3 w-25 opacity-25" />
                  <p className="fw-normal opacity-75 mt-3 mb-0">
                    Brandon worked 8 years as a distributed systems and AI/ML
                    engineer at Square. He’s spent the last decade making indie
                    films and being plugged into the Atlanta art scene. In
                    college he built a{" "}
                    <a
                      href="https://www.youtube.com/watch?v=x034jVB1avs"
                      target="_blank"
                      rel="noreferrer"
                      className="text-red"
                    >
                      laser projector
                    </a>{" "}
                    and programmed it to play video games on the side of
                    skyscrapers. Today he’s working on disrupting Hollywood and
                    the music industry and transforming narrative storytelling
                    into something the likes of which we’ve never seen before.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 gx-lg-5 gy-md-5 pb-4 pt-3 pt-md-5">
            {teamMembers.map((member, index) => (
              <div className="col-6 col-md-3" key={index}>
                <div className="panel h-100">
                  <img
                    src={member.imageSrc}
                    className="img-fluid img-team"
                    alt=""
                  />
                  <div className="p-3 p-lg-4">
                    <p className="fw-semibold opacity-100 mb-0 fs-5">
                      {member.name}
                    </p>
                    <p className="team-role-text">{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* NB(bt): Need to ask Alex if we can add this.
          <h2 className="mb-4 mt-5">Our Advisor</h2>

          <div className="row g-4 g-md-5">
            {/ * <div className="col-6 col-md-3">
              <img
                src="/images/team/placeholder-pfp.jpg"
                className="img-fluid img-team opacity-50"
                alt=""
              />
            </div> * /}
            <div className="col-12 text-start d-flex flex-column justify-content-center">
              <p className="fw-semibold opacity-100 mb-0 fs-5 mt-2">
                Alex Wissner-Gross
              </p>
              <p className="team-role-text">Advisor</p>
              {/ * <hr className="mt-0 my-4" /> * /}
              <p className="fw-normal opacity-75 mt-1 mb-0">
                Alex was the last person to graduate from MIT with a triple
                major, and he’s led a combined 1B of startup exits.{" "}
                <br className="d-none d-md-block" />
                We’re hoping we’re his first decacorn exit.
              </p>
            </div>
          </div>
          */}
        </div>
      </div>
      <div id="mentions" className="bg-light section-2">
        <div>
          <Marquee gradient={false} speed={120}>
            <h1 className="marquee-title d-flex gap-3 gap-md-4 gap-lg-5 mt-0">
              <span className="text-outline">Press & Mentions</span>
              <span className="text-red">\</span>
              <span>Press & Mentions</span>
              <span className="text-red">\</span>
              <span className="text-outline">Press & Mentions</span>
              <span className="text-red">\</span>
              <span>Press & Mentions</span>
              <span className="text-red me-3 me-md-4 me-lg-5">\</span>
            </h1>
          </Marquee>
        </div>

        <div className="swiper">
          <Swiper
            loop={true}
            autoplay={{
              delay: 6000,
              disableOnInteraction: false,
            }}
            slidesPerView={1.1}
            centeredSlides={true}
            spaceBetween={50}
            grabCursor={true}
            breakpoints={{
              640: {
                slidesPerView: 1.5,
                spaceBetween: 10,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 40,
              },
              1024: {
                slidesPerView: 2.5,
                spaceBetween: 40,
              },
              1600: {
                slidesPerView: 4,
                spaceBetween: 50,
              },
            }}
            pagination={{
              clickable: true,
            }}
            modules={[Autoplay, Pagination]}
          >
            <SwiperSlide className="card swiper-card bg-dark-solid">
              <div className="d-flex flex-column gap-4 w-100">
                <div>
                  <img
                    className="mb-3"
                    src="/press-logos/techstars.png"
                    alt="Techstars Logo"
                    height="34"
                  />
                </div>

                <p className="swiper-text">
                  "Tool of the Week: AI voice generator | [FakeYou ...] is a
                  window into the future [...]. Play with it with a number of
                  celebrity voices, including Judi Dench, Neil DeGrasse Tyson,
                  and Bill Gates."
                  <br />
                  <br />— <b>Techstars</b>
                </p>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card bg-dark-solid">
              <div className="d-flex flex-column gap-4 w-100 align-items-start">
                <div>
                  <img
                    className="mb-2"
                    src="/press-logos/gigazine.png"
                    alt="Gigazine Logo"
                    height="40"
                  />
                </div>

                <p className="swiper-text">
                  "無料でビル・ゲイツやアーノルド・シュワルツネッガーなど有名人に好きな台詞をしゃべらせることができる「Vocodes」レビュー"
                  <br />
                  <br />
                  ("Vocodes" [now FakeYou] allows users to use celebrities such
                  as Bill Gates and Arnold Schwarzenegger to speak their
                  favorite lines for free.)
                  <br />
                  <br />— <b>Gigazine</b>
                </p>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card bg-dark-solid">
              <div className="d-flex flex-column gap-4 w-100">
                <div>
                  <img
                    className="mb-2"
                    src="/press-logos/shots.png"
                    alt="Shots Logo"
                    height="60"
                  />
                </div>

                <p className="swiper-text">
                  "Have you ever wanted David Attenborough to narrate your
                  audiobook? Judi Dench to read your shopping list? Gilbert
                  Gottfried to... well... some things are better left unsaid."
                  <br />
                  <br />— <b>Shots</b>
                </p>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card bg-dark-solid">
              <div className="d-flex flex-column gap-4 w-100">
                <div>
                  <img
                    className="mb-2"
                    src="/press-logos/larepublica.png"
                    alt="La Republica Logo"
                    height="34"
                  />
                </div>

                <p className="swiper-text">
                  "Un truco secreto de WhatsApp se acaba de volver tendencia en
                  las redes sociales, sobre todo entre los fanáticos de Dragon
                  Ball Super, debido a que permite que los usuarios puedan
                  enviar audios con la voz de Gokú"
                  <br />
                  <br />
                  (A secret WhatsApp trick has just become a trend on social
                  networks , especially among Dragon Ball Super fans , because
                  it allows users to send audios with the voice of Goku"
                  <br />
                  <br />— <b>La República</b>
                </p>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card bg-dark-solid">
              <div className="d-flex flex-column gap-4 w-100">
                <div>
                  <img
                    className="mb-2"
                    src="/press-logos/tnw.png"
                    alt="TNW Logo"
                    height="40"
                  />
                </div>

                <p className="swiper-text">
                  We’ve previously seen apps like this, but Vocodes [now
                  FakeYou] impresses with the sheer volume of voices available
                  to test out.
                  <br />
                  <br />— <b>TheNextWeb</b>
                </p>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card bg-dark-solid">
              <div className="d-flex flex-column gap-4 w-100">
                <p className="swiper-text">
                  "[Digital artist Glenn Marshall's recent project employs] a
                  classic 19th-century poem as AI-imaging fuel alongside an
                  uncanny narration from an artificial Christopher Lee. To make
                  "In the Bleak Midwinter" even more, uh, bleak, Marshall then
                  employed software called vo.codes [now FakeYou] to approximate
                  a poetic narration in the voice of the late Sir Christopher
                  Lee. [...] to be honest with you, we initially thought
                  Marshall simply dubbed an old audio recording of Lee actually
                  reading the poem, that's how convincing the result is."
                  <br />
                  <br />— <b>Input</b>
                </p>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
      <div id="contact" className="bg-light section-2 pb-0">
        <div className="container text-center">
          <h4 className="opacity-75 position-relative zi-2 mb-1">Contact Us</h4>
          <div className="position-relative">
            <a
              href="mailto:hello@storyteller.ai"
              className="display-1 contact-email"
            >
              hello@storyteller.ai
            </a>
            <div className="shape-bg dark small"></div>
          </div>
        </div>

        <div className="bg-dark-solid divider-logo-container">
          <div className="w-100 d-flex justify-content-center">
            <img
              src="/logo/Storyteller-Icon-Logo.png"
              alt="Storyteller Logo Icon"
              className="divider-logo"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default IndexPage;
