import {
  faChevronLeft,
  faChevronRight,
  faImages,
} from "@fortawesome/pro-solid-svg-icons";
import { useLocation, useParams } from "react-router-dom";
import { Button, ButtonLink } from "~/components";
import { AuthButtons } from "./AuthButtons";
import { SceneTitleInput } from "./SceneTitleInput";
import { getCurrentLocationWithoutParams } from "~/utilities";
import { Activity } from "~/pages/PageEnigma/comps/GenerateModals/Activity";
import { LibraryModal } from "~/pages/PageEnigma/comps/LibraryModal/LibraryModal";
import { useState } from "react";

function isEditorPath(path: string) {
  if (path === "/") return true;
  if (path === "/idealenigma/") return true;
  return false;
}
interface Props {
  pageName: string;
}

export const TopBar = ({ pageName }: Props) => {
  const currentLocation = getCurrentLocationWithoutParams(
    useLocation().pathname,
    useParams(),
  );
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState("my-media");

  const handleClick = () => {
    window.location.href = "https://storyteller-2d.netlify.app/";
  };

  return (
    <>
      <header className="fixed left-0 top-0 z-[60] w-full border-b border-white/5 bg-ui-background">
        <nav
          className="mx-auto grid h-[56px] w-screen grid-cols-3 items-center justify-between px-3"
          aria-label="navigation"
        >
          <div className="flex items-center gap-7">
            <a href="/">
              <span className="sr-only">ArtCraft</span>
              <img
                className="h-[28px] w-auto"
                src="/resources/images/artcraft-logo-3.png"
                alt="Logo ArtCraft"
              />
            </a>
            {!isEditorPath(currentLocation) && (
              <ButtonLink to={"/"} variant="secondary" icon={faChevronLeft}>
                Back to Editor
              </ButtonLink>
            )}
            <Button
              variant="secondary"
              icon={faChevronRight}
              iconClassName="text-xs"
              iconFlip={true}
              onClick={handleClick}
              className="bg-transparent p-0 text-sm text-white/80 hover:bg-transparent hover:text-white hover:underline hover:underline-offset-2"
            >
              Go to 2D Canvas
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 font-medium">
            <SceneTitleInput pageName={pageName} />
          </div>

          <div className="flex justify-end gap-3.5">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                icon={faImages}
                onClick={() => setIsLibraryModalOpen(true)}
              >
                My Gallery
              </Button>
              <Activity />
            </div>
            <div className="flex justify-end gap-2">
              <AuthButtons />
            </div>
          </div>
        </nav>
      </header>

      <LibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        mode="view"
        tabs={[
          { id: "my-media", label: "My media" },
          { id: "uploads", label: "Uploads" },
        ]}
        activeTab={activeLibraryTab}
        onTabChange={setActiveLibraryTab}
      />
    </>
  );
};
