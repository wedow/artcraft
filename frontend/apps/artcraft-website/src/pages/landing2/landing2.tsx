import { DiscordButton } from "../../components/discord-button";
import { motion } from "framer-motion";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.2,
      ease: "easeOut",
      staggerChildren: 0.1,
    },
  },
};

const Landing = () => {
  const videos = [
    {
      src: "https://www.youtube.com/embed/H4NFXGMuwpY?si=U2_m5Ic1YBn6176D",
    },
    {
      src: "https://www.youtube.com/embed/pGn-1BKo3nY?si=q4dm0ICb6wF1JW8N",
    },
    {
      src: "https://www.youtube.com/embed/7x7IZkHiGD8?si=tL8nK4CULigpfHQR",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots">
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-50" />
      {/* Hero Section */}
      <div className="relative flex overflow-hidden xl:items-center xl:pt-0 mb-0">
        <motion.div
          className="w-full flex flex-col items-center justify-center text-center pt-36 px-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <motion.div className="relative" variants={fadeUpVariants}>
            <h1 className="relative mb-6 md:mb-10 font-extrabold text-4xl sm:text-[3rem] md:text-[4rem] lg:text-[6rem] !leading-none">
              <span className="text-primary">“</span>
              Is this really AI?
              <span className="text-primary">”</span>
            </h1>
            <span className="absolute -right-5 bottom-1 md:-right-14 md:bottom-14 text-xl md:text-3xl font-bold opacity-40 italic">
              — You
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 mx-auto max-w-[100rem] px-4 md:px-16 lg:px-12 xl:px-32 lg:mb-32">
        <motion.div
          className="items-center gap-16 mb-12 p-4 bg-white/10 backdrop-blur-md rounded-[40px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="rounded-[24px] overflow-hidden bg-[#1C1C20]">
            <video
              muted
              autoPlay
              loop
              playsInline
              className="w-full aspect-[16/9] object-cover"
            >
              <source src="/videos/hero-video.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>
        <motion.div
          className="flex justify-center"
          variants={fadeUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <DiscordButton />
        </motion.div>
      </div>

      <div className="overflow-hidden py-24 sm:py-32">
        <motion.div
          className="mx-auto max-w-[88rem] md:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-2 lg:items-center">
            <motion.div
              className="px-6 lg:px-0 lg:pt-4 lg:pr-4"
              variants={fadeUpVariants}
            >
              <div className="max-w-2xl lg:mx-0 mb-10 md:mb-16">
                <h2 className="relative font-extrabold text-4xl md:text-5xl lg:text-6xl xl:text-[4.8rem] !leading-tight">
                  Our tool lets you design, control, and achieve{" "}
                  <span className="text-primary">great consistency.</span>
                </h2>
              </div>
              <DiscordButton />
            </motion.div>
            <div className="sm:px-6 lg:px-0">
              <div className="relative isolate overflow-hidden bg-indigo-500 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pr-0 lg:mx-0 lg:max-w-none">
                <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none border-[16px] border-white/10 rounded-3xl overflow-hidden">
                  <video
                    src="/videos/artcraft-3d-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-square w-full max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10 object-cover h-full rounded-lg overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="overflow-hidden md:py-24 sm:py-32">
        <motion.div
          className="mx-auto max-w-[88rem] md:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="grid grid-cols-1 gap-20 lg:grid-cols-2 lg:items-center">
            <div className="sm:px-6 lg:px-0 order-2 lg:order-1">
              <motion.div
                className="relative isolate overflow-hidden bg-indigo-500 sm:mx-auto sm:max-w-2xl sm:rounded-3xl sm:pr-0 lg:mx-0 lg:max-w-none"
                variants={fadeUpVariants}
              >
                <div className="mx-auto max-w-2xl sm:mx-0 sm:max-w-none border-[16px] border-white/10 rounded-3xl overflow-hidden">
                  <video
                    src="/videos/artcraft-canvas-demo.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="aspect-square w-full max-w-none rounded-tl-xl bg-gray-800 ring-1 ring-white/10 object-cover h-full rounded-lg overflow-hidden"
                  />
                </div>
              </motion.div>
            </div>
            <motion.div
              className="px-6 lg:px-0 lg:pt-4 lg:pr-4 order-1 lg:order-2"
              variants={fadeUpVariants}
            >
              <div className=" max-w-2xl lg:mx-0 mb-10 md:mb-16">
                <h2 className="relative font-extrabold text-4xl md:text-5xl lg:text-6xl xl:text-[4.8rem] !leading-tight">
                  <span className="text-primary">Patented</span> Brain to Art
                  Interface
                </h2>
              </div>
              <DiscordButton />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto max-w-screen px-4 py-32 sm:px-24 lg:px-32">
        {/* Videos Section */}
        <motion.div
          className="space-y-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <div className="text-center">
            <h1 className="md:mb-16 text-4xl md:text-7xl font-extrabold">
              Made using{" "}
              <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[5px] md:after:h-[12px] after:bg-primary/60 after:mb-1">
                ArtCraft
              </span>
            </h1>
            {/* <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              See examples of artwork created using ArtCraft.
            </p> */}
          </div>
          <div className="grid gap-8 xl:grid-cols-3">
            {videos.map((video, index) => (
              <motion.div
                key={index}
                className="group relative rounded-2xl bg-white/10 backdrop-blur-md p-1.5 transition-all duration-300 hover:bg-white/20 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20"
                variants={fadeUpVariants}
              >
                <div className="aspect-video overflow-hidden rounded-xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src={video.src}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-white/20 transition-colors duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1920px] px-4 md:pt-32 md:pb-56 sm:px-24 lg:px-32">
        {/* Discord CTA Section */}
        <motion.div
          className="flex flex-col items-center justify-center text-center p-12 py-20 rounded-[40px] bg-primary/30 backdrop-blur-md border-[6px] border-primary/60"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
        >
          <h2 className="relative mb-12 font-extrabold text-4xl lg:text-6xl max-w-3xl !leading-tight">
            Why haven't you joined our Discord yet?
          </h2>
          {/* <p className="text-lg text-gray-400 mb-8 max-w-2xl">
            Connect with other creators, share your work, get feedback, and stay
            updated with the latest features and updates.
          </p> */}
          <DiscordButton />
        </motion.div>
      </div>

      <div></div>
    </div>
  );
};

export default Landing;
