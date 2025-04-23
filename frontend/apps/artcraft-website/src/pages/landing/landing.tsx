import { Button } from "@storyteller/ui-button";
import { DownloadButton } from "../../components/download-button";

const Landing = () => {
  // const features = [
  //   {
  //     title: "Lorem ipsum dolor sit",
  //     description:
  //       "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.",
  //     image: "/images/features/ai-creation.jpg",
  //     tag: "Core",
  //   },
  //   {
  //     title: "Ut enim ad minim",
  //     description:
  //       "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea.",
  //     image: "/images/features/collaboration.jpg",
  //     tag: "Workflow",
  //   },
  //   {
  //     title: "Duis aute irure dolor",
  //     description:
  //       "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla.",
  //     image: "/images/features/style-models.jpg",
  //     tag: "Tools",
  //   },
  // ];

  const installationSteps = [
    {
      step: "STEP 1",
      title: "Download the app",
      description:
        "Download and install our application to start creating amazing AI-powered content.",
      button: {
        text: "Download App",
        className:
          "rounded-lg bg-[#2D81FF] px-4 py-2 text-sm font-medium hover:bg-[#438AF6]",
        variant: "primary" as const,
      },
    },
    {
      step: "STEP 2",
      title: "Create an account",
      description:
        "Sign up for an account to access all features and start your journey.",
      button: {
        text: "Sign up",
        className: "text-sm font-medium",
        variant: "secondary" as const,
      },
    },
    {
      step: "STEP 3",
      title: "Start creating",
      description: "Begin creating with our AI editor!",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      {/* Hero Section */}
      <div className="relative flex overflow-hidden xl:items-center xl:pt-0">
        <div className="w-full flex flex-col items-center justify-center text-center pt-40 pb-20 px-10">
          <div className="relative">
            <div className="absolute -inset-1 rounded-lg blur-xl"></div>
            <h1 className="relative mb-10 font-bold text-5xl lg:text-7xl">
              AI Canvas & Scene Editor
              <br />
              <span>On your </span>
              <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[9px] after:bg-primary/60 after:mb-1.5">
                local machine
              </span>
              <span>.</span>
            </h1>
          </div>

          <p className="mb-12 max-w-2xl text-lg lg:text-xl leading-relaxed text-gray-300">
            Create stunning artwork with the power of AI. Perfect for artists,
            designers, and creators who want to push the boundaries of their
            creativity.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            <DownloadButton />
            <Button
              className="rounded-xl px-8 py-4 text-md border-2 border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 backdrop-blur-md"
              onClick={() => window.open("/download", "_self")}
            >
              Learn more
            </Button>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse-slow" />
        </div>
      </div>

      {/* Video Sections */}
      <div className="relative z-10 mx-auto max-w-[1920px] px-4 py-20 sm:px-24 lg:px-32">
        {/* First Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-16 mb-32 p-5 pr-16 bg-white/10 backdrop-blur-md rounded-[80px]">
          <div className="lg:col-span-3 rounded-[60px] overflow-hidden bg-[#1C1C20]">
            <video
              muted
              autoPlay
              loop
              className="w-full aspect-[4/3] object-cover"
            >
              <source src="/videos/artcraft-canvas-demo.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="lg:col-span-2 space-y-9">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight">
                Draw it, Dream it, AI it
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Draw freely, arrange images, and create collages on our
                intuitive 2D canvas. Once your composition is ready, use AI to
                generate a polished artwork that matches your exact layout and
                vision. Perfect for sketching ideas and turning them into
                stunning finished pieces.
              </p>
            </div>
            <Button className="rounded-lg px-5 py-3.5 text-md bg-[#2D81FF] hover:bg-[#438AF6]">
              Start Creating
            </Button>
          </div>
        </div>

        {/* Second Video Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 items-center gap-16 p-5 pl-16 bg-white/10 backdrop-blur-md rounded-[80px]">
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-9">
            <div className="space-y-6">
              <h2 className="text-5xl font-bold leading-tight">
                Compose in 3D, Bring your ideas to life
              </h2>
              <p className="text-lg text-gray-400 leading-relaxed">
                Compose your perfect 3D scene by arranging elements and
                positioning your camera. Our AI understands your scene layout
                and generates consistent, high-quality 3D artwork that matches
                your composition, including maintaining character consistency
                throughout your scenes.
              </p>
            </div>
            <Button className="rounded-lg px-5 py-3.5 text-md bg-[#2D81FF] hover:bg-[#438AF6]">
              Learn More
            </Button>
          </div>
          <div className="lg:col-span-3 order-1 lg:order-2 rounded-[60px] overflow-hidden bg-[#1C1C20]">
            <video
              muted
              autoPlay
              loop
              className="w-full aspect-[4/3] object-cover"
            >
              <source src="/videos/artcraft-3d-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1920px] px-4 pt-20 pb-40 sm:px-24 lg:px-32">
        {/* Features Section */}
        {/* <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold">Features</h1>
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
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div> */}

        {/* Installation Steps Section */}
        <div>
          <h1 className="mb-12 text-5xl font-bold">How to install ArtCraft</h1>
          <div className="grid gap-6 md:grid-cols-3">
            {installationSteps.map((step, index) => (
              <div
                key={index}
                className="rounded-xl bg-white/10 backdrop-blur-md p-8"
              >
                <div className="mb-4 w-fit rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
                  {step.step}
                </div>
                <h3 className="mb-4 text-2xl font-semibold">{step.title}</h3>
                <p className="mb-6 text-gray-400">{step.description}</p>
                {step.button && (
                  <Button
                    className={step.button.className}
                    variant={step.button.variant}
                  >
                    {step.button.text}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
