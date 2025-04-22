import { Button } from "@storyteller/ui-button";
import { faApple, faWindows } from "@fortawesome/free-brands-svg-icons";
import { faDesktop } from "@fortawesome/pro-solid-svg-icons";
import { isMobile, isWindows, isMacOs } from "react-device-detect";
import { useRef, useState } from "react";
import { DOWNLOAD_LINKS } from "../../config/downloads";

const Landing = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videos = [
    "/videos/artcraft-canvas-demo.mp4",
    "/videos/artcraft-3d-demo.mp4",
  ];

  const handleVideoEnd = () => {
    if (videoRef.current) {
      const nextIndex = (currentVideoIndex + 1) % videos.length;
      setCurrentVideoIndex(nextIndex);
      videoRef.current.src = videos[nextIndex];
      videoRef.current.play();
    }
  };

  const handleDownload = () => {
    const downloadLink = isWindows
      ? DOWNLOAD_LINKS.WINDOWS
      : isMacOs
      ? DOWNLOAD_LINKS.MACOS
      : null;
    if (downloadLink) {
      window.open(downloadLink, "_blank");
    }
  };

  const features = [
    {
      title: "Lorem ipsum dolor sit",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
      image: "/images/features/ai-creation.jpg",
      tag: "Core",
    },
    {
      title: "Ut enim ad minim",
      description:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea.",
      image: "/images/features/collaboration.jpg",
      tag: "Workflow",
    },
    {
      title: "Duis aute irure dolor",
      description:
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.",
      image: "/images/features/style-models.jpg",
      tag: "Tools",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#101014] text-white">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      {/* Hero Section */}
      <div className="relative flex overflow-hidden pt-24 xl:min-h-[1000px] xl:items-center xl:pt-0">
        {/* Content Container */}
        <div className="relative z-10 mx-auto grid h-full w-full max-w-[1920px] grid-cols-12 items-center px-6 md:px-16 xl:px-32">
          <div className="z-10 col-span-12 w-full xl:absolute xl:left-0 xl:top-1/2 xl:max-w-4xl xl:-translate-y-1/2 xl:pl-32 before:xl:absolute before:xl:-inset-0 before:xl:-z-10 before:xl:mr-40 before:xl:rounded-full before:xl:bg-black/90 before:xl:to-transparent before:xl:blur-[180px]">
            <div className="max-w-2xl">
              <div className="mb-6">
                <span className="text-lg font-semibold uppercase tracking-widest text-gray-400">
                  ArtCraft
                </span>
              </div>

              <h1 className="mb-6 font-bold leading-tight lg:text-6xl">
                AI editor.
                <br />
                On your local machine.
              </h1>

              <p className="mb-10 max-w-xl text-lg leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  className="rounded-lg px-5 py-3.5 text-md"
                  disabled={isMobile || (!isWindows && !isMacOs)}
                  icon={isMobile ? faDesktop : isWindows ? faWindows : faApple}
                  onClick={handleDownload}
                >
                  {isMobile
                    ? "Download on desktop"
                    : isWindows
                    ? "Download for Windows"
                    : isMacOs
                    ? "Download for MacOS"
                    : "Not available on your device"}
                </Button>
              </div>
            </div>
          </div>
          <div className="col-span-12 mt-12 aspect-video w-full transform overflow-hidden rounded-xl border border-white/[16%] bg-transparent md:mt-16 xl:col-span-9 xl:col-start-4 xl:mt-0">
            <video
              ref={videoRef}
              muted
              autoPlay
              className="h-full w-full object-cover object-top opacity-90"
              onEnded={handleVideoEnd}
              src={videos[currentVideoIndex]}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 mx-auto max-w-[1920px] px-4 py-20 sm:px-24 lg:px-32">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Features</h1>
          {/* <button className="text-sm text-[#0096CE] hover:text-[#0084B5]">
            View all
          </button> */}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((item, index) => (
            <div
              key={index}
              className="group cursor-pointer overflow-hidden rounded-xl bg-[#1C1C20] transition hover:bg-[#27272B]"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                {/* <div className="mb-4 text-sm text-[#0096CE]">{item.tag}</div> */}
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Installation Steps Section */}
        <div className="mt-36">
          <h1 className="mb-12 text-5xl font-bold">
            How to install Mira AI Editor
          </h1>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-[#1C1C20] p-8">
              <div className="mb-4 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
                STEP 1
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Download the app</h3>
              <p className="mb-6 text-gray-400">
                Download and install our application to start creating amazing
                AI-powered content.
              </p>
              <Button className="rounded-lg bg-[#2D81FF] px-4 py-2 text-sm font-medium hover:bg-[#438AF6]">
                Download App
              </Button>
            </div>

            <div className="rounded-xl bg-[#1C1C20] p-8">
              <div className="mb-4 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
                STEP 2
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Create an account</h3>
              <p className="mb-6 text-gray-400">
                Sign up for an account to access all features and start your
                journey.
              </p>
              <Button className="text-sm font-medium" variant="secondary">
                Sign up
              </Button>
            </div>

            <div className="rounded-xl bg-[#1C1C20] p-8">
              <div className="mb-4 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
                STEP 3
              </div>
              <h3 className="mb-4 text-2xl font-semibold">Start creating</h3>
              <p className="mb-6 text-gray-400">
                Begin creating with our realtime AI editor!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
