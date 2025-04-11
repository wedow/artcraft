import Navbar from "../../../components/landing/Navbar";
import Hero from "../../../components/landing/Hero";
import FeatureCard from "../../../components/landing/FeatureCard";
import Footer from "../../../components/landing/Footer";

const Landing = () => {
  const features = [
    {
      title: "Step 1: Compose Your Scene",
      description:
        "Begin your story on our intuitive canvas. Drop and arrange photos and videos to create layered scenes. Position, scale, and transform elements with precision to build your perfect composition. Our dynamic canvas makes it easy to bring your vision to life.",
      image: "/images/feature_compositing.png",
      gradient: "bg-gradient-to-br from-purple-500/20 to-blue-500/20",
    },
    {
      title: "Step 2: Smart Segmentation",
      description:
        "Clean up your scenes with powerful AI segmentation. Remove green screens instantly, isolate subjects from any background, and perfect your layer masks with intelligent tools. Create professional-quality compositions with just a few clicks.",
      image: "/images/feature_segmentation.png",
      gradient: "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20",
    },
    {
      title: "Step 3: AI Style Transfer",
      description:
        "Transform your composition with AI style transfer magic. Choose from our curated collection of artistic styles. Apply consistent styling across your entire scene to create a cohesive visual masterpiece.",
      image: "/images/feature_ai_stylize.png",
      gradient: "bg-gradient-to-br from-rose-500/20 to-orange-500/20",
    },
    {
      title: "Step 4: Render Your Video",
      description:
        "Render your styled composition into a stunning final movie. Export in high quality, ready to share with the world.",
      image: "/images/feature_render.png",
      gradient: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    },
  ];

  const scrollToFeature = (index: number) => {
    const element = document.getElementById(`feature-${index + 1}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div>
        <Hero onFeatureClick={scrollToFeature} />

        <section className="relative overflow-hidden py-32">
          {/* Decorative elements */}
          <div className="dotted-pattern absolute inset-0 opacity-50" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section header with enhanced styling */}
            <div className="mx-auto mb-24 max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 px-8 py-2.5">
                <span className="whitespace-nowrap bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-sm font-semibold text-transparent">
                  AI-POWERED WORKFLOW
                </span>
              </div>
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900">
                Create Stunning Videos in
                <span className="relative">
                  <span className="gradient-text relative z-10">
                    {" "}
                    Four Simple Steps
                  </span>
                  <span className="bg-rose-200/50 absolute -bottom-2 left-0 z-0 h-3 w-full" />
                </span>
              </h2>
              <p className="text-xl leading-relaxed text-gray-600">
                From composition to final render, transform your media into
                cinematic stories with our powerful AI-enhanced workflow.
              </p>
            </div>

            {/* Features stack with enhanced visual separation */}
            <div className="relative space-y-32">
              {/* Vertical timeline line */}
              <div className="to-rose-500/20 absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-purple-500/20 via-blue-500/20" />

              {features.map((feature, index) => (
                <div
                  key={index}
                  id={`feature-${index + 1}`}
                  className="relative"
                >
                  {/* Step number bubble */}
                  <div className="absolute left-1/2 -translate-x-1/2 -translate-y-16">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-lg">
                      <span className="bg-gradient-to-br from-purple-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <FeatureCard {...feature} isReversed={index % 2 === 1} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Landing;
