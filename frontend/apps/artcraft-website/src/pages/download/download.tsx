import {
  faApple,
  faWindows,
  faLinux,
} from "@fortawesome/free-brands-svg-icons";
import { faArrowDownToLine } from "@fortawesome/pro-solid-svg-icons";
import { DownloadButton } from "../../components/download-button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { DOWNLOAD_LINKS } from "../../config/downloads";

const Download = () => {
  const systemRequirements = [
    {
      os: "Windows",
      icon: faWindows,
      requirements: [
        "Windows 10 (64-bit) or newer",
        "8GB RAM minimum",
        "4GB available storage",
      ],
    },
    {
      os: "macOS",
      icon: faApple,
      requirements: [
        "macOS 12.0 or newer",
        "8GB RAM minimum",
        "4GB available storage",
      ],
    },
    {
      os: "Linux",
      icon: faLinux,
      requirements: [
        "Ubuntu 20.04 or newer",
        "8GB RAM minimum",
        "4GB available storage",
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />

      {/* Hero Section */}
      <div className="relative flex overflow-hidden">
        <div className="w-full flex flex-col items-center justify-center text-center pt-40 pb-20 px-10">
          <h1 className="relative mb-10 font-bold text-5xl lg:text-7xl">
            Download ArtCraft
          </h1>

          <p className="mb-12 max-w-xl text-lg lg:text-xl leading-relaxed text-gray-300">
            Use ArtCraft to easily create AI-powered artwork on your computer,
            with canvas editing and 3D scene composition.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 mb-20">
            <DownloadButton />
          </div>

          <div className="w-full max-w-7xl mb-20">
            <img
              src="/images/3d-interface-preview.jpg"
              alt="ArtCraft Interface Preview"
              className="w-full rounded-xl border-2 border-white/10"
            />
          </div>

          {/* System Requirements */}
          <div className="w-full max-w-6xl mb-20">
            <h2 className="text-3xl font-bold mb-10">System Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {systemRequirements.map((system, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-8 flex flex-col gap-4 items-center"
                >
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <FontAwesomeIcon
                      icon={system.icon}
                      className="text-2xl text-white/80"
                    />
                    <h3 className="text-2xl font-semibold">{system.os}</h3>
                  </div>
                  <ul className="space-y-3 mb-5">
                    {system.requirements.map((req, idx) => (
                      <li key={idx} className="text-gray-300">
                        {req}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-fit"
                    onClick={() => {
                      const downloadLink =
                        system.os === "Windows"
                          ? DOWNLOAD_LINKS.WINDOWS
                          : system.os === "macOS"
                          ? DOWNLOAD_LINKS.MACOS
                          : DOWNLOAD_LINKS.LINUX;
                      window.open(downloadLink, "_blank");
                    }}
                    icon={faArrowDownToLine}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
