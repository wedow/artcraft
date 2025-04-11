import { useNavigate } from "react-router-dom";
import { Button } from "../ui";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className="fixed top-0 z-50 w-full bg-[rgba(16,16,20,0.7)] backdrop-blur-3xl">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-24 lg:px-32">
        <div className="flex h-[72px] items-center justify-between">
          <a href="/" className="flex items-center">
            <img
              src="/brand/mira-logo.png"
              alt="Mira Realtime AI Editor"
              className="h-[34px] pb-1"
            />
          </a>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              className=""
              onClick={() => navigate("/signup")}
            >
              Sign up
            </Button>
            <Button
              className="hidden bg-[#2D81FF] hover:bg-[#438AF6] md:block"
              onClick={() => []}
            >
              Download
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
