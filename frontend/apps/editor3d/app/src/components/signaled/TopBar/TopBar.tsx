import { useRef, useState } from "react";
import {
  faGear,
  faImages,
  faCube,
  faFilm,
  faPaintbrush,
  faImage,
  faPenNib,
  // faGem,
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
import { downloadFileFromUrl, FilterMediaClasses } from "@storyteller/api";
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
// import { usePricingModalStore } from "@storyteller/ui-pricing-modal"; - Uncomment for pricing modal - BFlat
import toast from "react-hot-toast";
import { gtagEvent } from "@storyteller/google-analytics";

interface Props {
  pageName: string;
  loginSignUpPressed: () => void;
}

const SWITCHER_THROTTLE_TIME = 500; // milliseconds

const appMenuTabs: MenuIconItem[] = [
  {
    id: "2D",
    label: "2D Canvas",
    icon: <FontAwesomeIcon icon={faPaintbrush} />,
    imageSrc: "/resources/gifs/artcraft-canvas-demo.gif",
    description: "Easy edits. Great for graphic design.",
    large: true,
  },
  {
    id: "3D",
    label: "3D Editor",
    icon: <FontAwesomeIcon icon={faCube} />,
    imageSrc: "/resources/gifs/artcraft-3d-demo.gif",
    description: "Precision control. Great for AI film.",
    large: true,
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
  {
    id: "EDIT",
    label: "Edit Image",
    icon: <FontAwesomeIcon icon={faPenNib} />,
  }
];

export const topNavMediaId = signal<string>("");
export const topNavMediaUrl = signal<string>("");

export const TopBar = ({ pageName, loginSignUpPressed }: Props) => {
  useSignals();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenGalleryModal = () => {
    galleryModalVisibleViewMode.value = true;
    galleryModalVisibleDuringDrag.value = true;
    gtagEvent("open_gallery_modal", { "tab": tabStore.activeTabId });
  };

  const tabStore = useTabStore();

  const is3DSceneReady = is3DSceneLoaded.value;
  const is3DEditorReady = is3DEditorInitialized.value;
  const [disableSwitcher, setDisableSwitcher] = useState(false);
  const switcherThrottle = useRef(false);

  const disableTabSwitcher = () => {
    return (
      disableSwitcher ||
      (useTabStore.getState().activeTabId === "3D" &&
        !is3DEditorReady &&
        !is3DSceneReady)
    );
  };

  const downloadFile = async (url: string, mediaClass?: string) => {
    try {
      await downloadFileFromUrl(url);
      if (mediaClass === FilterMediaClasses.DIMENSIONAL) {
        toast.success(`Downloaded 3D model`);
      } else {
        toast.success(`Downloaded ${mediaClass}`);
      }
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const getPageTitle = () : string => {
    switch (tabStore.activeTabId) {
      case "2D":
        return "Canvas";
      case "3D":
        return "3D Editor";
      case "IMAGE":
        return "Text to Image";
      case "VIDEO":
        return "Image to Video";
      case "EDIT":
        return "Edit Image";
      default:
        return "Artcraft";
    }
  };

  const pageTitle = getPageTitle();

  // const { toggleModal } = usePricingModalStore(); - Uncomment for pricing modal - BFlat

  return (
    <>
      <header className="fixed left-0 top-0 z-[60] w-full border-b border-white/5 bg-ui-background">
        <nav
          className="mx-auto grid h-[56px] w-screen grid-cols-3 items-center justify-between px-3"
          aria-label="navigation"
        >
          <div className="flex items-center gap-7">
            <div>
              <span className="sr-only">ArtCraft</span>
              <img
                className="h-[24px] w-auto"
                src="/resources/images/artcraft-logo-3.png"
                alt="Logo ArtCraft"
              />
            </div>
            <MenuIconSelector
              menuItems={appMenuTabs}
              activeMenu={tabStore.activeTabId}
              disabled={disableTabSwitcher()}
              onMenuChange={(tabId) => {
                gtagEvent("switch_tab", { "tab": tabId });

                // Prevent a second input if the switcher is throttled.
                if (switcherThrottle.current) {
                  return;
                }
                switcherThrottle.current = true;
                setDisableSwitcher(true);

                // Disable 3d engine to prevent memory leak.
                if (tabId === "3D") {
                  set3DPageMounted(true);
                } else {
                  set3DPageMounted(false);
                }
                useTabStore.getState().setActiveTab(tabId);
                setTimeout(() => {
                  // Clear the throttle
                  switcherThrottle.current = false;
                  // Trigger a new re-render (important)
                  setDisableSwitcher(false);
                }, SWITCHER_THROTTLE_TIME);
              }}
              className="w-fit"
            />
          </div>

          <div className="flex items-center justify-center gap-2 font-medium">
            {tabStore.activeTabId === "3D" ? (
              <SceneTitleInput pageName={pageName} />
            ) : (
              <h1>
                {pageTitle}
              </h1>
            )}
          </div>

          <div className="flex justify-end gap-3.5 pr-2">
            <div className="flex gap-2">
              {/* - Uncomment for pricing modal - BFlat */}
              {/* <Button
                variant="primary"
                icon={faGem}
                onClick={toggleModal}
                className="shadow-md shadow-primary-500/50 transition-all duration-300 hover:shadow-md hover:shadow-primary-500/75"
              >
                Upgrade Now
              </Button> */}
              <Tooltip content="Settings" position="bottom" delay={300}>
                <Button
                  variant="secondary"
                  icon={faGear}
                  className="h-[38px] w-[38px]"
                  onClick={() => {
                    setIsSettingsModalOpen(true);
                    gtagEvent("open_settings_modal");
                  }}
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
            <AuthButtons loginSignUpPressed={loginSignUpPressed} />
          </div>
        </nav>
      </header>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => setLogoutStates()}
      />

      <GalleryModal mode="view" onDownloadClicked={downloadFile} />
    </>
  );
};
