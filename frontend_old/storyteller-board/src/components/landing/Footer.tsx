import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faDiscord } from "@fortawesome/free-brands-svg-icons";
import { Button } from "../ui";
import { faArrowRight } from "@fortawesome/pro-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-10 text-center">
          <img
            src="/brand/Storyteller-Logo-Black.png"
            alt="Storyteller Board"
            className="h-9"
          />

          <Button
            onClick={() => navigate("/signup")}
            className="group rounded-xl px-8 py-4 text-lg"
          >
            <span className="relative flex items-center">
              Start Creating for Free
              <FontAwesomeIcon
                icon={faArrowRight}
                className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1"
              />
            </span>
          </Button>

          <div className="flex justify-center space-x-8">
            <a
              href="https://twitter.com/get_storyteller"
              className="!text-gray-500 transition-colors hover:!text-gray-600"
            >
              <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
              <span className="sr-only">Twitter</span>
            </a>
            <a
              href="https://discord.gg/storyteller"
              className="!text-gray-500 transition-colors hover:!text-gray-600"
            >
              <FontAwesomeIcon icon={faDiscord} className="h-6 w-6" />
              <span className="sr-only">Discord</span>
            </a>
          </div>

          <div className="text-sm font-medium text-gray-500">
            <p>© {currentYear} Storyteller AI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
