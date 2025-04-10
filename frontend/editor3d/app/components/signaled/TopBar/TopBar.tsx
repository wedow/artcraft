import { useLocation, useParams } from "@remix-run/react";
import { faChevronLeft, faImages } from "@fortawesome/pro-solid-svg-icons";
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

  return (
    <>
      <header className="fixed left-0 top-0 z-30 w-full border-b border-ui-panel-border bg-ui-background">
        <nav
          className="mx-auto grid h-[64px] w-screen grid-cols-3 items-center justify-between p-3"
          aria-label="Global"
        >
          <div className="flex gap-4">
            <a href="/" className="">
              <span className="sr-only">Storyteller.ai</span>
              <img
                className="h-[39px] w-auto pb-[3px]"
                src="/resources/images/Storyteller-Logo-1.png"
                alt="Logo StoryTeller.ai"
              />
            </a>
            {!isEditorPath(currentLocation) && (
              <ButtonLink to={"/"} variant="secondary" icon={faChevronLeft}>
                Back to Editor
              </ButtonLink>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 font-medium">
            <SceneTitleInput pageName={pageName} />
          </div>

          <div className="flex justify-end gap-5">
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
