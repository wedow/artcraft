import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/pagination";
import "./MentionsSection.scss";
import { AdHorizontal } from "../AdBanner";

interface MentionsSectionProps {}

const MentionsSection: React.FC<MentionsSectionProps> = () => {
  return (
    <>
      <AdHorizontal format="horizontal" />

      <div className="mentions-section text-center px-4 px-lg-0">
        <h1 className="fw-bold pb-5 mb-3 fs-4">
          Trusted by over 10 million users around the world
        </h1>

        <div className="mentions-swiper">
          <Swiper
            loop={true}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            slidesPerView={1}
            spaceBetween={30}
            centeredSlides={false}
            grabCursor={true}
            breakpoints={{
              640: {
                slidesPerView: 1,
                spaceBetween: 10,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
              1600: {
                slidesPerView: 4,
                spaceBetween: 30,
              },
            }}
            pagination={{ clickable: true }}
            modules={[Autoplay, Pagination]}
            className="mentions-swiper-main"
          >
            <SwiperSlide className="card swiper-card">
              <div className="d-flex flex-column gap-4 w-100">
                <div className="mention-badge">Techstars</div>
                <div className="mention-content">
                  <img
                    className="mention-logo"
                    src="/fakeyou/press-logos/techstars.png"
                    alt="Techstars Logo"
                    height="34"
                  />
                  <p className="swiper-text">
                    "Tool of the Week: AI voice generator | [FakeYou ...] is a
                    window into the future [...]. Play with it with a number of
                    celebrity voices, including Judi Dench, Neil DeGrasse Tyson,
                    and Bill Gates."
                  </p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card">
              <div className="d-flex flex-column gap-4 w-100">
                <div className="mention-badge">Gigazine</div>
                <div className="mention-content">
                  <img
                    className="mention-logo"
                    src="/fakeyou/press-logos/gigazine.png"
                    alt="Gigazine Logo"
                  />
                  <p className="swiper-text">
                    "無料でビル・ゲイツやアーノルド・シュワルツネッガーなど有名人に好きな台詞をしゃべらせることができる「FakeYou」レビュー"
                    <br />
                    ([FakeYou] allows users to use celebrities such as Bill
                    Gates and Arnold Schwarzenegger to speak their favorite
                    lines for free.)
                  </p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card">
              <div className="d-flex flex-column gap-4 w-100">
                <div className="mention-badge">Shots</div>
                <div className="mention-content">
                  <img
                    className="mention-logo"
                    src="/fakeyou/press-logos/shots.png"
                    alt="Shots Logo"
                    style={{ height: "80px" }}
                  />
                  <p className="swiper-text">
                    "Have you ever wanted David Attenborough to narrate your
                    audiobook? Judi Dench to read your shopping list? Gilbert
                    Gottfried to... well... some things are better left unsaid."
                  </p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card">
              <div className="d-flex flex-column gap-4 w-100">
                <div className="mention-badge">La República</div>
                <div className="mention-content">
                  <img
                    className="mention-logo"
                    src="/fakeyou/press-logos/larepublica.png"
                    alt="La República Logo"
                    height="34"
                  />
                  <p className="swiper-text">
                    "Un truco secreto de WhatsApp se acaba de volver tendencia
                    en las redes sociales, sobre todo entre los fanáticos de
                    Dragon Ball Super, debido a que permite que los usuarios
                    puedan enviar audios con la voz de Gokú"
                    <br />
                    (A secret WhatsApp trick has just become a trend on social
                    networks , especially among Dragon Ball Super fans , because
                    it allows users to send audios with the voice of Goku)
                  </p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card">
              <div className="d-flex flex-column gap-4 w-100">
                <div className="mention-badge">TheNextWeb</div>
                <div className="mention-content">
                  <img
                    className="mention-logo"
                    src="/fakeyou/press-logos/tnw.png"
                    alt="TNW Logo"
                    height="40"
                  />
                  <p className="swiper-text">
                    We’ve previously seen apps like this, but [FakeYou]
                    impresses with the sheer volume of voices available to test
                    out.
                  </p>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide className="card swiper-card">
              <div className="d-flex flex-column gap-4 w-100">
                <div className="mention-badge">Input</div>
                <div className="mention-content">
                  <p className="swiper-text">
                    "[Digital artist Glenn Marshall's recent project employs] a
                    classic 19th-century poem as AI-imaging fuel alongside an
                    uncanny narration from an artificial Christopher Lee. To
                    make "In the Bleak Midwinter" even more, uh, bleak, Marshall
                    then employed software called [FakeYou] to approximate a
                    poetic narration in the voice of the late Sir Christopher
                    Lee. [...] to be honest with you, we initially thought
                    Marshall simply dubbed an old audio recording of Lee
                    actually reading the poem, that's how convincing the result
                    is."
                  </p>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>
      </div>
    </>
  );
};

export default MentionsSection;
