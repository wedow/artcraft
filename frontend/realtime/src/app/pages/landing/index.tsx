import Navbar from "../../../components/landing/Navbar";
import Footer from "../../../components/landing/Footer";
import { Button } from "~/components/ui";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import { faDesktop } from "@fortawesome/pro-solid-svg-icons";
import { useIsMobile } from "~/hooks/useIsMobile";

const Landing = () => {
  const isMobile = useIsMobile();
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
      <Navbar />

      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      {/* Hero Section */}
      <div className="relative flex overflow-hidden pt-24 xl:min-h-[1000px] xl:items-center xl:pt-0">
        {/* Content Container */}
        <div className="relative z-10 mx-auto grid h-full w-full max-w-[1920px] grid-cols-12 items-center px-6 md:px-16 xl:px-32">
          <div className="z-10 col-span-12 w-full xl:absolute xl:left-0 xl:top-1/2 xl:max-w-4xl xl:-translate-y-1/2 xl:pl-32 before:xl:absolute before:xl:-inset-0 before:xl:-z-10 before:xl:mr-40 before:xl:rounded-full before:xl:bg-black/90 before:xl:to-transparent before:xl:blur-[180px]">
            <div className="max-w-2xl">
              <div className="mb-6">
                <span className="text-lg font-semibold uppercase tracking-widest text-gray-400">
                  MIRA
                </span>
              </div>

              <h1 className="mb-6 font-bold leading-tight lg:text-6xl">
                Realtime AI editor.
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
                  className={`w-full transform rounded-lg px-8 py-4 font-semibold transition sm:w-auto ${
                    isMobile
                      ? "cursor-not-allowed bg-[#2D81FF]"
                      : "bg-[#2D81FF] hover:scale-105 hover:bg-[#438AF6]"
                  }`}
                  disabled={isMobile}
                  icon={isMobile ? faDesktop : faApple}
                >
                  {isMobile ? "Download on desktop" : "Download for MacOS"}
                </Button>
                <button className="w-full transform rounded-lg border border-white/30 px-8 py-4 font-semibold transition hover:scale-105 hover:bg-white/10 sm:w-auto">
                  Learn more
                </button>
              </div>
            </div>
          </div>
          <div className="col-span-12 mt-12 aspect-video w-full transform overflow-hidden rounded-xl border border-white/[15%] bg-transparent md:mt-16 xl:col-span-9 xl:col-start-4 xl:mt-0">
            <img
              src="/images/landing_hero.png"
              alt="AI Video Creation"
              className="h-full w-full object-cover object-top opacity-90"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 mx-auto mb-32 max-w-[1920px] px-4 py-20 sm:px-24 lg:px-32">
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
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
