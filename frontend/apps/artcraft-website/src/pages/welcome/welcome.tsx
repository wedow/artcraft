import {
  faCheckCircle,
  faDownload,
  faDesktop,
  faRocket,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Link } from "react-router-dom";
import { isMobile, isMacOs } from "react-device-detect";
import { DOWNLOAD_LINKS } from "../../config/downloads";

const Welcome = () => {
  const downloadUrl = isMacOs ? DOWNLOAD_LINKS.MACOS : DOWNLOAD_LINKS.WINDOWS;

  return (
    <div className="relative min-h-[calc(100vh-1px)] pt-20 md:pt-0 overflow-hidden bg-[#101014] text-white flex flex-col items-center justify-center p-4">
      <main className="relative z-10 w-full max-w-2xl">
        <div className="bg-[#28282C] rounded-[32px] overflow-hidden shadow-2xl border border-white/5">
          <div className="p-8 pt-10 text-center flex flex-col items-center">
            <h1 className="text-4xl font-bold mb-4 text-white tracking-tight gap-4 flex items-center">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-4xl bg-[#28282C] text-primary rounded-full"
              />
              <div>
                Welcome to <span className="text-primary">ArtCraft</span>
              </div>
            </h1>

            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto leading-relaxed font-medium">
              Your account is ready. Let's get you set up to create.
            </p>

            <div className="w-full mb-8">
              {/* Information Column */}
              <div className="bg-[#1E1E22] border border-white/5 rounded-3xl p-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <h3 className="font-bold text-white text-xl">Next Steps</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div className="bg-[#252529] p-3 rounded-xl flex items-center gap-3">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-primary/60 flex items-center justify-center text-xs font-bold text-white/80">
                      1
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      Open the installer
                    </div>
                  </div>
                  <div className="bg-[#252529] p-3 rounded-xl flex items-center gap-3">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-primary/60 flex items-center justify-center text-xs font-bold text-white/80">
                      2
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      Follow setup instructions
                    </div>
                  </div>
                  <div className="bg-[#252529] p-3 rounded-xl flex items-center gap-3">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-primary/60 flex items-center justify-center text-xs font-bold text-white/80">
                      3
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      Log in to account
                    </div>
                  </div>
                  <div className="bg-[#252529] p-3 rounded-xl flex items-center gap-3">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-primary/60 flex items-center justify-center text-xs font-bold text-white/80">
                      4
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      Start creating!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contingency / Action Area */}
            {!isMobile && (
              <div className="flex flex-col items-center pt-6 border-t border-white/5">
                <p className="text-white/40 text-sm mb-4 font-medium uppercase tracking-wider">
                  Download didn't start?
                </p>
                <Button
                  as="link"
                  href={downloadUrl}
                  className="bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-10 py-3 text-sm font-bold rounded-xl"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download for {isMacOs ? "Mac" : "Windows"}
                </Button>
                <div className="mt-5 flex gap-6 text-sm font-medium text-white/30">
                  <a
                    href={DOWNLOAD_LINKS.WINDOWS}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    Windows .exe
                  </a>
                  <a
                    href={DOWNLOAD_LINKS.MACOS}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    Mac .dmg
                  </a>
                </div>
              </div>
            )}

            {isMobile && (
              <div className="bg-[#431407] border border-orange-900/50 rounded-2xl p-6 text-orange-200 text-sm leading-relaxed">
                <div className="flex items-center justify-center mb-3 text-orange-400">
                  <FontAwesomeIcon icon={faDesktop} className="text-2xl" />
                </div>
                ArtCraft is a powerful desktop experience. <br />
                Please head to your computer to download and install.
              </div>
            )}
          </div>

          {/* Footer of Card */}
          <div className="bg-[#1F1F22] p-4 text-center border-t border-white/5">
            <Link
              to="/"
              className="text-white/40 hover:text-white text-sm font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Welcome;
