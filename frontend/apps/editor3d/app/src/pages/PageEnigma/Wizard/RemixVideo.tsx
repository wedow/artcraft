import { useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";
import { useEffect, useRef, useState } from "react";
import { selectedRemixCard } from "~/pages/PageEnigma/Wizard/signals/wizard";
import { LoadingSpinner } from "~/components";

export const RemixVideo = ({
  card,
}: {
  card: {
    title: string;
    text: string;
    defaultVideo: string;
    hoverVideo: string;
    token: string;
  };
}) => {
  useSignals();
  const [hover, setHover] = useState(false);
  const defaultVideoRef = useRef<HTMLVideoElement>(null);
  const hoverVideoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const defaultVideo = defaultVideoRef.current;
    const hoverVideo = hoverVideoRef.current;

    if (defaultVideo && hoverVideo) {
      const onCanPlayThrough = () => {
        if (defaultVideo.readyState >= 4 && hoverVideo.readyState >= 4) {
          setIsReady(true);
          defaultVideo.play();
          hoverVideo.play();
        }
      };

      defaultVideo.addEventListener("canplaythrough", onCanPlayThrough);
      hoverVideo.addEventListener("canplaythrough", onCanPlayThrough);

      return () => {
        defaultVideo.removeEventListener("canplaythrough", onCanPlayThrough);
        hoverVideo.removeEventListener("canplaythrough", onCanPlayThrough);
      };
    }
  }, []);

  const handleMouseEnter = () => {
    if (defaultVideoRef.current && hoverVideoRef.current) {
      hoverVideoRef.current.currentTime = defaultVideoRef.current.currentTime;
      setHover(true);
    }
  };

  const handleMouseLeave = () => {
    setHover(false);
  };

  return (
    <div>
      <button
        key={card.token}
        className={twMerge(
          "relative block aspect-video w-[352px] overflow-hidden rounded-lg border transition-all duration-150",
          card.token === selectedRemixCard.value?.token
            ? "border-brand-primary"
            : "border-white/5 hover:border-white/25",
        )}
        onClick={() => (selectedRemixCard.value = card)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="absolute bottom-0 left-0 z-10 h-1/4 w-full object-cover"
          style={{
            background:
              "linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)",
          }}
        />
        <video
          className="absolute left-0 top-0 h-full w-full object-cover"
          ref={defaultVideoRef}
          src={card.defaultVideo}
          crossOrigin="anonymous"
          autoPlay
          loop
          muted
          style={{ opacity: hover ? 0 : 1 }}
        />
        <video
          className="absolute left-0 top-0 h-full w-full object-cover"
          ref={hoverVideoRef}
          src={card.hoverVideo}
          crossOrigin="anonymous"
          autoPlay
          loop
          muted
          style={{ opacity: hover ? 1 : 0 }}
        />
        {!isReady && (
          <div className="absolute left-0 top-0 h-full w-full bg-black/10 object-cover">
            <div className="flex h-full w-full items-center justify-center">
              <LoadingSpinner />
            </div>
          </div>
        )}

        <div
          className="text-md absolute bottom-[8px] left-[8px] z-10 font-medium"
          style={{
            textShadow: "0px 0px 10px rgba(0, 0, 0, 0.4)",
          }}
        >
          {card.title}
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className={`absolute right-1.5 top-1.5 h-[22px] w-[22px] transition-opacity duration-200 ease-in-out ${
            card.token === selectedRemixCard.value?.token
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <path
            opacity="1"
            d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
            fill="#FC6B68"
          />
          <path
            d="M369 175c-9.4 9.4-9.4 24.6 0 33.9L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c-9.4-9.4 24.6-9.4 33.9 0z"
            fill="#FFFFFF"
          />
        </svg>
      </button>
      <p className="mt-2 text-xs text-white/70">{card.text}</p>
    </div>
  );
};
