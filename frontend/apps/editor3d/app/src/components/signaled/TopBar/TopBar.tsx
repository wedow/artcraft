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
import {
  GalleryModal,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { downloadFileFromUrl } from "@storyteller/api";
import { TabSelector, TabItem } from "@storyteller/ui-tab-selector";
import { Signal, signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { setLogoutStates } from "~/signals/authentication/utilities";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";

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
  { id: "VIDEO", label: "Video" },
];

export const topNavMediaId = signal<string>("");
export const topNavMediaUrl = signal<string>("");

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [url, setUrl] = useState<string>("");
  const [mediaId, setMediaId] = useState<string>("");

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
    console.log("Items to add to scene", currentAppTabId);
    console.log("url", url);
    console.log("media_id", media_id);

    setUrl(url);
    setMediaId(media_id ?? "");

    if (currentAppTabId === "2D") {
      console.log("Adding to 2D scene");
      // from the uploaded image url.
    } else if (currentAppTabId === "3D") {
      console.log("Adding to 3D scene");
      // media id from the image selected from gallery.
      if (media_id) {
        engine3D?.activeScene.loadObject(media_id, "image", true);
      } else {
        console.warn("No media id provided");
      }
    } else if (currentAppTabId === "VIDEO") {
      console.log("Adding to Video scene");
      topNavMediaId.value = media_id ?? "";
      topNavMediaUrl.value = url;
    } else {
      console.warn(`Unknown tab type: ${currentAppTabId}`);
    }
  };

  const handleOpenGalleryModal = () => {
    galleryModalVisibleDuringDrag.value = true;
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
            {currentAppTabId === "3D" ? (
              <SceneTitleInput pageName={pageName} />
            ) : (
              <h1>{currentAppTabId === "2D" ? "Canvas" : "Generate Video"}</h1>
            )}
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
                onClick={handleOpenGalleryModal}
              >
                My Library
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
        isOpen={galleryModalVisibleDuringDrag.value}
        onClose={() => (galleryModalVisibleDuringDrag.value = false)}
        mode="view"
        onDownloadClicked={downloadFileFromUrl}
        onAddToSceneClicked={handleAddToScene}
      />
    </>
  );
};
