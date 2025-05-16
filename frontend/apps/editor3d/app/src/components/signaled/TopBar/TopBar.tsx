import { useContext, useEffect, useState } from "react";
import {
  faChevronLeft,
  faGear,
  faImages,
} from "@fortawesome/pro-solid-svg-icons";
import { useLocation, useParams } from "react-router-dom";
import { Button, ButtonLink } from "~/components";
import { AuthButtons } from "./AuthButtons";
import { SceneTitleInput } from "./SceneTitleInput";
import { getCurrentLocationWithoutParams } from "~/utilities";
import { Activity } from "~/pages/PageEnigma/comps/GenerateModals/Activity";
import { GalleryModal } from "@storyteller/ui-gallery-modal";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { downloadFileFromUrl } from "@storyteller/api";
import { TabSelector, TabItem } from "@storyteller/ui-tab-selector";
import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { setLogoutStates } from "~/signals/authentication/utilities";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { useAppUiContext } from "~/pages/Page2d/contextSignals/appUi";

function isEditorPath(path: string) {
  if (path === "/") return true;
  if (path === "/idealenigma/") return true;
  return false;
}

interface Props {
  pageName: string;
  appTabIdSignal: Signal<string>;
  setAppTabId: (id: string) => void;
  is3DInitSignal: Signal<boolean>;
}

const appTabs: TabItem[] = [
  { id: "2D", label: "2D" },
  { id: "3D", label: "3D" },
  // { id: "VIDEO", label: "Video" },
];

export const TopBar = ({
  pageName,
  appTabIdSignal,
  setAppTabId,
  is3DInitSignal,
}: Props) => {
  useSignals();

  const currentLocation = getCurrentLocationWithoutParams(
    useLocation().pathname,
    useParams(),
  );
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState("my-media");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const engine3D = useContext(EngineContext);
  const handleTabChange = (tabId: string) => {
    if (appTabIdSignal.peek() == "3D") {
      engine3D?.unmountEngine();
    }
    setAppTabId(tabId);
  };

  const currentAppTabId = appTabIdSignal.value;
  const is3DInit = is3DInitSignal.value;
  useEffect(() => {
    if (currentAppTabId == "3D" && is3DInit) {
      engine3D?.remountEngine();
    }
  }, [currentAppTabId, engine3D, is3DInit]);

  const handleAddToScene = async (
    url: string,
    media_id: string | undefined,
  ) => {
    console.log("add to scene", url);
    if (currentAppTabId === "2D") {
      console.log("Adding to 2D scene");

      // from the uploaded image url.
    } else if (currentAppTabId === "3D") {
      console.log("Adding to 3D scene");

      // from the uploaded image url.
      // engine3D?.activeScene.loadObjectFromUrl(
      //   "https://cdn-2.fakeyou.com/media/r/h/0/5/3/rh053gbx8yvjwk1mdvag4gkr5c0h9wbh/image_rh053gbx8yvjwk1mdvag4gkr5c0h9wbh.png",
      // );

      // from the gallery modal.
      // engine3D?.activeScene.loadObjectFromUrl(
      //   "https://cdn-2.fakeyou.com/media/1/t/b/0/e/1tb0e53691mdgqmtd4fmzy58wp96vwxz/image_1tb0e53691mdgqmtd4fmzy58wp96vwxz.png",
      // );

      // // working media id m_ehq8051fx4hddhja54a7zmz897cgrk
      // engine3D?.activeScene.loadObject(
      //   "m_ehq8051fx4hddhja54a7zmz897cgrk",
      //   "image",
      //   true,
      // );

      // media id from the image selected from gallery.
      engine3D?.activeScene.loadObject(media_id, "image", true);
    } else if (currentAppTabId === "VIDEO") {
      console.log("Adding to Video scene");
    } else {
      console.warn(`Unknown tab type: ${currentAppTabId}`);
    }
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
            <TabSelector
              tabs={appTabs}
              activeTab={appTabIdSignal.value}
              disabled={false}
              onTabChange={handleTabChange}
              className="w-fit"
            />
          </div>

          <div className="flex items-center justify-center gap-2 font-medium">
            <SceneTitleInput pageName={pageName} />
          </div>

          <div className="flex justify-end gap-3.5">
            <div className="flex gap-2">
              <Tooltip content="Settings" position="bottom" delay={300}>
                <Button
                  variant="secondary"
                  icon={faGear}
                  className="h-[38px] w-[38px]"
                  onClick={() => setIsSettingsModalOpen(true)}
                />
              </Tooltip>
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

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => setLogoutStates()}
      />

      <GalleryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        mode="view"
        tabs={[
          { id: "my-media", label: "My generations" },
          { id: "uploads", label: "My uploads" },
        ]}
        activeTab={activeLibraryTab}
        onTabChange={setActiveLibraryTab}
        onDownloadClicked={downloadFileFromUrl}
        onAddToSceneClicked={handleAddToScene}
      />
    </>
  );
};
