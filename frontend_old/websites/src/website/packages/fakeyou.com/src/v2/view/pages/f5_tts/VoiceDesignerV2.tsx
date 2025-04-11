import React, { useState, useEffect, useContext } from "react";
import "./F5TTS.scss";
import { Button, Container, Panel } from "components/common";
import {
  faArrowRight,
  faMicrophoneAlt,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { AppStateContext } from "components/providers/AppStateProvider";

const endDate = new Date("2024-10-18T12:00:00-04:00");

interface TimeLeft {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

function calculateTimeLeft(): TimeLeft {
  const difference = +endDate - +new Date();
  let timeLeft: TimeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return timeLeft;
}

export default function VoiceDesignerV2(): JSX.Element {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [localEndTime, setLocalEndTime] = useState<string>("");
  const { sessionWrapper } = useContext(AppStateContext);

  usePrefixedDocumentTitle("F5-TTS Zero-Shot Voice Cloning");

  useEffect(() => {
    updateLocalEndTime();

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function updateLocalEndTime() {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    };
    setLocalEndTime(endDate.toLocaleDateString("en-US", options));
  }

  return (
    <>
      <div
        style={{
          background: `url("/images/bg-svg.svg") no-repeat center center`,
          backgroundSize: "cover",
          width: "100%",
          height: "100vh",
        }}
      >
        <Container
          type="panel"
          className="d-flex align-items-center justify-content-center"
          style={{ height: "calc(100vh - 65px)", maxWidth: "768px" }}
        >
          <Panel padding={true}>
            <div className="countdown-container">
              <FontAwesomeIcon icon={faMicrophoneAlt} className="icon mb-3" />
              <h1 className="fw-bold mb-1">F5-TTS Voice Cloning</h1>
              <p className="description">
                New zero-shot voice cloning coming soon...
              </p>
              <div className="countdown-wrapper">
                {Object.entries(timeLeft).map(([interval, value]) => (
                  <div key={interval} className="countdown-item">
                    <span className="countdown-value">{value}</span>
                    <span className="countdown-label">{interval}</span>
                  </div>
                ))}
              </div>

              <div className="local-time mt-3 text-white opacity-50">
                <small>Countdown ends local time: {localEndTime}</small>
              </div>

              {!sessionWrapper.isLoggedIn() && (
                <Button
                  label="Sign up before launch"
                  className="mt-4"
                  icon={faArrowRight}
                  iconFlip={true}
                  to="/signup"
                />
              )}
            </div>
          </Panel>
        </Container>
      </div>
      <Container type="panel" className="faq-section">
        <h2>What is F5-TTS?</h2>
        <div className="row g-5">
          <div className="col-md-6 faq-item">
            <h3>What is F5-TTS?</h3>
            <p>
              F5-TTS is an AI-driven text-to-speech tool that transforms written
              text into lifelike speech. With real-time processing, it’s great
              for generating dynamic audio content, whether it's for
              voice-overs, digital storytelling, or any other project that
              requires high-quality spoken output.
            </p>
          </div>
          <div className="col-md-6 faq-item">
            <h3>How does F5-TTS work?</h3>
            <p>
              F5-TTS leverages advanced AI techniques, like Flow Matching and
              Diffusion Transformers, to turn text into speech. It skips some of
              the traditional steps like phoneme alignment and duration
              prediction, producing more natural-sounding audio directly from
              your input text.
            </p>
          </div>
          <div className="col-md-6 faq-item">
            <h3>What kind of audio quality can I expect from F5-TTS?</h3>
            <p>
              F5-TTS delivers high-quality audio with clear, natural intonation,
              making it a perfect fit for professional projects like podcasts,
              audiobooks, and educational content. The speech it generates is
              crisp and lifelike, designed to meet the standards of any polished
              audio production.
            </p>
          </div>
          <div className="col-md-6 faq-item">
            <h3>Can F5-TTS be used for voice-over work?</h3>
            <p>
              Absolutely! F5-TTS is a fantastic tool for voice-over production.
              Its zero-shot voice cloning feature allows you to create different
              voices for various characters or narrators, and it even supports
              emotional expression to add extra nuance and depth to your audio
              content.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
