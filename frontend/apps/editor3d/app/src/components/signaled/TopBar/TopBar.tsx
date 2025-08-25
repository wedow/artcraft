import { useRef, useState } from "react";
import {
  faGear,
  faImages,
  faCube,
  faFilm,
  faPaintbrush,
  faImage,
  faPenNib,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faWindowRestore,
  faSquare,
  faXmark,
  faDash,
} from "@fortawesome/pro-regular-svg-icons";
import { Button } from "@storyteller/ui-button";
import { AuthButtons } from "./AuthButtons";
import { SceneTitleInput } from "./SceneTitleInput";
import { Activity } from "~/pages/PageEnigma/comps/GenerateModals/Activity";
import {
  GalleryModal,
  galleryModalVisibleViewMode,
  galleryModalVisibleDuringDrag,
  galleryModalLightboxVisible,
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
import {
  useTauriWindowControls,
  useTauriPlatform,
} from "@storyteller/tauri-utils";
import { useEditStore } from "../../../pages/PageEdit/stores/EditState";
import { BaseSelectorImage } from "../../../pages/PageEdit/BaseImageSelector";

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
  },
];

export const topNavMediaId = signal<string>("");
export const topNavMediaUrl = signal<string>("");

export const TopBar = ({ pageName, loginSignUpPressed }: Props) => {
  useSignals();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { isDesktop, isMaximized, minimize, toggleMaximize, close } =
    useTauriWindowControls();
  const platform = useTauriPlatform();

  const handleOpenGalleryModal = () => {
    galleryModalVisibleViewMode.value = true;
    galleryModalVisibleDuringDrag.value = true;
    gtagEvent("open_gallery_modal", { tab: tabStore.activeTabId });
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

  const handleEditFromGallery = async (url: string, mediaId?: string) => {
    try {
      // Reset editor state
      useEditStore.getState().RESET();

      // Switch to EDIT tab
      useTabStore.getState().setActiveTab("EDIT");

      // Select the image for editing
      const baseImage: BaseSelectorImage = {
        url,
        mediaToken: mediaId || "",
      };
      useEditStore.getState().setBaseImageInfo(baseImage);

      // Close gallery modal and lightbox if open
      galleryModalVisibleViewMode.value = false;
      galleryModalVisibleDuringDrag.value = false;
      galleryModalLightboxVisible.value = false;
    } catch (e) {
      // no-op
    }
  };

  const getPageTitle = (): string => {
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
      <header
        className="fixed left-0 top-0 z-[60] w-full border-b border-white/5 bg-ui-background"
        data-tauri-drag-region
      >
        <nav
          className="mx-auto grid h-[56px] w-screen grid-cols-3 items-center justify-between ps-3"
          aria-label="navigation"
          data-tauri-drag-region
        >
          <div className="flex items-center gap-3" data-tauri-drag-region>
            <div className="mr-2" data-tauri-drag-region>
              <span className="sr-only" data-tauri-drag-region>
                ArtCraft
              </span>
              <img
                className="h-[24px] w-auto"
                src="/resources/images/artcraft-logo-3.png"
                alt="Logo ArtCraft"
                data-tauri-drag-region
              />
            </div>
            <MenuIconSelector
              menuItems={appMenuTabs}
              activeMenu={tabStore.activeTabId}
              disabled={disableTabSwitcher()}
              onMenuChange={(tabId) => {
                gtagEvent("switch_tab", { tab: tabId });

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
              className="no-drag w-fit"
            />
          </div>

          <div
            className={`${tabStore.activeTabId === "3D" ? "no-drag" : ""} flex items-center justify-center gap-2 font-medium`}
            data-tauri-drag-region
          >
            {tabStore.activeTabId === "3D" ? (
              <SceneTitleInput pageName={pageName} />
            ) : (
              <h1 data-tauri-drag-region>{pageTitle}</h1>
            )}
          </div>

          <div className="flex justify-end gap-2" data-tauri-drag-region>
            <div className="no-drag flex gap-2">
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
            <div className="no-drag">
              <AuthButtons loginSignUpPressed={loginSignUpPressed} />
            </div>
            {isDesktop && platform !== "macos" && (
              <div className="no-drag flex items-center">
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={minimize}
                >
                  <FontAwesomeIcon icon={faDash} className="text-xs" />
                </Button>
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={toggleMaximize}
                >
                  <FontAwesomeIcon
                    icon={isMaximized ? faWindowRestore : faSquare}
                    className="text-xs"
                  />
                </Button>
                <Button
                  variant="secondary"
                  className="h-[32px] w-[44px] rounded-none bg-transparent text-white/70 hover:bg-red/40 hover:text-white"
                  onClick={close}
                >
                  <FontAwesomeIcon icon={faXmark} className="text-lg" />
                </Button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => setLogoutStates()}
      />

      <GalleryModal
        mode="view"
        onDownloadClicked={downloadFile}
        onEditClicked={handleEditFromGallery}
      />
    </>
  );
};
