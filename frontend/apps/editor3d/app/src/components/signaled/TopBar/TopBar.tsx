import { useState } from "react";
import {
  faGear,
  faImages,
  faCube,
  faFilm,
  faPaintbrush,
  faImage,
} from "@fortawesome/pro-solid-svg-icons";
import { Button } from "@storyteller/ui-button";
import { AuthButtons } from "./AuthButtons";
import { SceneTitleInput } from "./SceneTitleInput";
import { Activity } from "~/pages/PageEnigma/comps/GenerateModals/Activity";
import {
  GalleryModal,
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
} from "@storyteller/ui-gallery-modal";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { Tooltip } from "@storyteller/ui-tooltip";
import { downloadFileFromUrl } from "@storyteller/api";
import {
  MenuIconSelector,
  MenuIconItem,
} from "@storyteller/ui-menu-icon-selector";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { setLogoutStates } from "~/signals/authentication/utilities";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTabStore } from "~/pages/Stores/TabState";
import {
  is3DEditorInitialized,
  is3DSceneLoaded,
  set3DPageMounted,
} from "~/pages/PageEnigma/Editor/editor";
interface Props {
  pageName: string;
}

const appMenuTabs: MenuIconItem[] = [
  {
    id: "2D",
    label: "2D Canvas",
    icon: <FontAwesomeIcon icon={faPaintbrush} />,
  },
  {
    id: "3D",
    label: "3D Editor",
    icon: <FontAwesomeIcon icon={faCube} />,
  },
  {
    id: "IMAGE",
    label: "Prompt to Image",
    icon: <FontAwesomeIcon icon={faImage} />,
  },
  {
    id: "VIDEO",
    label: "Image to Video",
    icon: <FontAwesomeIcon icon={faFilm} />,
  },
];

export const topNavMediaId = signal<string>("");
export const topNavMediaUrl = signal<string>("");

export const TopBar = ({ pageName }: Props) => {
  useSignals();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenGalleryModal = () => {
    galleryModalVisibleViewMode.value = true;
    galleryModalVisibleDuringDrag.value = true;
  };

  const tabStore = useTabStore();

  const is3DSceneReady = is3DSceneLoaded.value;
  const is3DEditorReady = is3DEditorInitialized.value;
  const disableTabSwitcher = () => {
    return (
      useTabStore.getState().activeTabId === "3D" &&
      !is3DEditorReady &&
      !is3DSceneReady
    );
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
                className="h-[24px] w-auto"
                src="/resources/images/artcraft-logo-3.png"
                alt="Logo ArtCraft"
              />
            </a>
            <MenuIconSelector
              menuItems={appMenuTabs}
              activeMenu={tabStore.activeTabId}
              disabled={disableTabSwitcher()}
              onMenuChange={(tabId) => {
                // Disable 3d engine to prevent memory leak.
                if (tabId === "3D") {
                  set3DPageMounted(true);
                } else {
                  set3DPageMounted(false);
                }
                useTabStore.getState().setActiveTab(tabId);
              }}
              className="w-fit"
            />
          </div>

          <div className="flex items-center justify-center gap-2 font-medium">
            {tabStore.activeTabId === "3D" ? (
              <SceneTitleInput pageName={pageName} />
            ) : (
              <h1>
                {tabStore.activeTabId === "2D"
                  ? "Canvas"
                  : tabStore.activeTabId === "VIDEO"
                    ? "Generate Video"
                    : "Generate Image"}
              </h1>
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

      <GalleryModal mode="view" onDownloadClicked={downloadFileFromUrl} />
    </>
  );
};
