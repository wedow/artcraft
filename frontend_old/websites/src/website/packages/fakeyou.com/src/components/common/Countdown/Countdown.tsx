import { faArrowRight, IconDefinition } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Container, Panel } from "components/common";
import { AppStateContext } from "components/providers/AppStateProvider";
import React, { useState, useEffect, useContext } from "react";
import "./Countdown.scss";

interface TimeLeft {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

interface CountdownProps {
  endDate: Date;
  title: string;
  description: string;
  icon?: IconDefinition;
}

export default function Countdown({
  endDate,
  title,
  description,
  icon,
}: CountdownProps): JSX.Element {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [localEndTime, setLocalEndTime] = useState<string>("");
  const { sessionWrapper } = useContext(AppStateContext);

  useEffect(() => {
    updateLocalEndTime();

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  });

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
    <Container
      type="panel"
      className="d-flex align-items-center justify-content-center"
      style={{ height: "calc(100vh - 65px)", maxWidth: "768px" }}
    >
      <Panel padding={true}>
        <div className="countdown-container">
          {icon && (
            <div className="countdown-icon mb-3">
              <FontAwesomeIcon icon={icon} />
            </div>
          )}
          <h1 className="fw-bold mb-1">{title}</h1>
          <p className="description">{description}</p>
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
  );
}
