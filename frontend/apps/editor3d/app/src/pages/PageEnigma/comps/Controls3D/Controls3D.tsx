import {
  faArrowsRotate,
  faArrowsUpDownLeftRight,
  faMagicWandSparkles,
  faPlus,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";
import { SettingsModal } from "@storyteller/ui-settings-modal";
import { EngineContext } from "../../contexts/EngineContext";
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  Create3dModal,
  useCreate3dModalStore,
} from "@storyteller/ui-create-3d-modal";
// import { v4 as uuidv4 } from "uuid";
// import { addObject } from "../../signals/objectGroup/addObject";
// import { MediaItem } from "../../models/assets";
import { GetFalApiKey } from "@storyteller/tauri-api"; // Fix import path
// eslint-disable-next-line import/no-unresolved
// import { AssetType } from "~/enums";
import { selectedMode } from "../../signals/selectedMode";
import { useSignals } from "@preact/signals-react/runtime";
import { outlinerState } from "../../signals/outliner/outliner";
import { twMerge } from "tailwind-merge";
// eslint-disable-next-line import/no-unresolved
import { setLogoutStates } from "~/signals/authentication/utilities";
import { useGalleryModal } from "@storyteller/ui-gallery-modal";

export const Controls3D = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const [showEmptySceneTooltip, setShowEmptySceneTooltip] = useState(false);
  // Action reminder is now handled through signals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Track processed 3D models by their media token to prevent duplicates
  const processedModelsRef = useRef<Record<string, boolean>>({});

  const { openView, isOpen: isGalleryOpen } = useGalleryModal();

  useEffect(() => {
    const checkSceneEmpty = () => {
      const isSceneEmpty =
        outlinerState.items.value.length === 0 && !isGalleryOpen;
      setShowEmptySceneTooltip(isSceneEmpty);
    };

    // Initial check
    checkSceneEmpty();

    // Subscribe to outliner state changes
    const unsubscribe = outlinerState.items.subscribe(checkSceneEmpty);

    return () => {
      unsubscribe();
    };
  }, [isGalleryOpen]);

  const handleModeChange = (value: string) => {
    selectedMode.value = value;
    switch (value) {
      case "move":
        handleMoveArrows();
        break;
      case "rotate":
        handleRotateArrows();
        break;
      case "scale":
        handleZoomArrows();
        break;
      default:
        console.log("Unknown option");
    }
  };

  const handleMoveArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("translate");
  };
  const handleRotateArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("rotate");
  };
  const handleZoomArrows = () => {
    if (!editorEngine) {
      return;
    }
    editorEngine.change_mode("scale");
  };

  // ----- TODO LATER - BFlat for auto add 3d model to scene -----

  // Function to add the generated 3D model to the scene
  // const addGeneratedModelToScene = useCallback((mediaToken: string) => {
  //   console.log("[DEBUG] addGeneratedModelToScene called with token:", mediaToken);

  //   // Create a MediaItem object for the 3D model
  //   const mediaItem: MediaItem = {
  //     version: 1,
  //     type: AssetType.OBJECT,
  //     media_id: mediaToken,
  //     name: "3D Model",
  //     object_uuid: uuidv4(),
  //   };

  //   // Add the object to the scene
  //   console.log("[DEBUG] Calling addObject with:", mediaItem);
  //   try {
  //     addObject(mediaItem);
  //     console.log("[DEBUG] addObject called successfully");
  //   } catch (error) {
  //     console.error("[DEBUG] Error in addObject:", error);
  //   }
  // }, []);

  const handleOpenModal = () => {
    openView("3d");
  };

  const handleOpenCreate3dModal = async () => {
    try {
      const falApiKeyResult = await GetFalApiKey();

      if (
        falApiKeyResult.status === "success" &&
        "payload" in falApiKeyResult &&
        falApiKeyResult.payload?.key
      ) {
        // API key exists, open the create 3D modal
        useCreate3dModalStore.getState().open();
      } else {
        // No API key, show the action reminder modal
        showActionReminder({
          reminderType: "default",
          title: "FAL API Key Required",
          message:
            "To generate 3D models, you need to add a valid FAL API key in your settings.",
          primaryActionText: "Add now",
          secondaryActionText: "Cancel",
          onPrimaryAction: () => {
            // Close the action reminder modal first
            isActionReminderOpen.value = false;
            // Then open the settings modal
            openSettingsModal();
          },
        });
      }
    } catch (error) {
      console.error("Error checking FAL API key:", error);
    }
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  // Handle completed models from the Create3dModal component
  const handleModelComplete = useCallback((mediaToken: string) => {
    // Check if we've already processed this model
    if (mediaToken && !processedModelsRef.current[mediaToken]) {
      // Mark this model as processed to avoid duplicates
      processedModelsRef.current[mediaToken] = true;

      // Add the generated 3D model to the scene
      // addGeneratedModelToScene(mediaToken);
    }
  }, []);

  const modes = [
    {
      value: "move",
      icon: faArrowsUpDownLeftRight,
      text: "Move",
      tooltip: "Move (T)",
    },
    {
      value: "rotate",
      icon: faArrowsRotate,
      text: "Rotate",
      tooltip: "Rotate (R)",
    },
    {
      value: "scale",
      icon: faUpRightAndDownLeftFromCenter,
      text: "Scale",
      tooltip: "Scale (G)",
    },
  ];

  return (
    <>
      <div className="flex justify-center">
        <div className="glass rounded-b-xl p-1.5 pr-2 text-white shadow-md">
          <div className="flex items-center justify-center gap-2.5">
            <div className="flex items-center gap-1">
              <div className="relative">
                {showEmptySceneTooltip && (
                  <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 transform whitespace-nowrap">
                    <div className="animate-bounce rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white shadow-lg">
                      Click + to add your first 3D asset!
                      <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transform bg-brand-primary" />
                    </div>
                  </div>
                )}
                <Tooltip
                  content="Add 3D asset to scene (B)"
                  position="bottom"
                  delay={300}
                  closeOnClick
                  className={twMerge(
                    showEmptySceneTooltip ? "hidden" : "block",
                  )}
                >
                  <Button
                    icon={faPlus}
                    className={`h-9 w-9 rounded-[10px] text-lg ${
                      showEmptySceneTooltip
                        ? "border-white/80 bg-brand-primary/90"
                        : ""
                    }`}
                    onClick={handleOpenModal}
                  />
                </Tooltip>
              </div>
              <Tooltip
                content="Create 3D model from image"
                position="bottom"
                delay={300}
                closeOnClick
              >
                <Button
                  icon={faMagicWandSparkles}
                  className="text-md h-9 w-9 rounded-[10px] bg-white/15 transition-colors hover:bg-white/25"
                  variant="secondary"
                  onClick={handleOpenCreate3dModal}
                />
              </Tooltip>
            </div>

            <span className="opacity-20">|</span>
            <ButtonIconSelect
              options={modes}
              onOptionChange={handleModeChange}
              selectedOption={selectedMode.value}
            />
          </div>
        </div>
      </div>

      <Create3dModal onModelComplete={handleModelComplete} />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        globalAccountLogoutCallback={() => setLogoutStates()}
        initialSection="accounts"
      />
    </>
  );
};
