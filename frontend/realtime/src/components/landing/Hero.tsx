import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "../ui";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";

import { invoke } from '@tauri-apps/api/core';

import { useNavigate } from "react-router-dom";

interface HeroProps {
  onFeatureClick: (index: number) => void;
}

const Hero = ({ onFeatureClick }: HeroProps) => {
  const navigate = useNavigate();

  const features = [
    { text: "Canvas Compositing", icon: "🎬", index: 0 },
    { text: "Smart Segmentation", icon: "✂️", index: 1 },
    { text: "AI Stylization", icon: "🎨", index: 2 },
  ];

  return (
    <div className="dotted-pattern relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Creative beta badge */}
          <a
            href="https://discord.gg/storyteller"
            target="_blank"
            className="group mb-12 inline-flex cursor-pointer items-center rounded-full bg-black/5 px-6 py-2 !text-gray-800 backdrop-blur-sm transition-colors hover:bg-black/10 hover:!text-gray-700"
          >
            <FontAwesomeIcon
              icon={faDiscord}
              className="mr-2 h-4 w-4 text-gray-600"
            />
            <span className="bg-clip-text text-sm font-medium">
              Join our Creators Community
            </span>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
            />
          </a>

          {/* Dynamic heading */}
          <h1 className="mb-8 text-6xl font-bold tracking-tight sm:text-7xl">
            {/* <span className="inline-block transform cursor-default transition-transform hover:scale-105">
              Compose.
            </span>{" "} */}
            <span className="inline-block transform cursor-default transition-transform hover:-rotate-3">
              Storyteller
            </span>{" "}
            <span className="relative inline-block">
              <span className="gradient-text">Board</span>
            </span>
          </h1>

          {/* Interactive feature pills */}
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            {features.map(({ text, icon, index }) => (
              <div
                key={text}
                onClick={() => onFeatureClick(index)}
                className="group flex transform cursor-pointer items-center space-x-2 rounded-full bg-gray-100/50 px-5 py-2 backdrop-blur-sm transition-all hover:scale-105"
              >
                <span className="text-lg group-hover:animate-bounce">
                  {icon}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {text}
                </span>
              </div>
            ))}
          </div>

          <br />
          <Button onClick={() => invoke("my_custom_command")}>Test Backend Call: Custom command</Button>
          <br />
          <Button onClick={() => invoke("test_round_trip")}>Test Backend Call: Round trip</Button>
          <br />
          <Button onClick={() => invoke("infer_image")}>Test Backend Call: Image</Button>
          <br />

          {/* Creative description */}
          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-gray-600">
            Create stunning visual stories on our intelligent canvas.
            <span className="font-semibold text-gray-800">
              {" "}
              Compose scenes, remove backgrounds, apply AI styles
            </span>{" "}
            and render beautiful movies in minutes.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Hero;
