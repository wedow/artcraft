import { useContext, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSignals, useSignalEffect } from "@preact/signals-react/runtime";
import {
  faCheckSquare,
  faFile,
  faQuestion,
  faSquare,
} from "@fortawesome/pro-solid-svg-icons";
import {
  EditorExpandedI,
  EngineContext,
} from "~/pages/PageEnigma/contexts/EngineContext";
import { ToastTypes, getArtStyle } from "~/enums";
import { scene, signalScene, authentication, addToast } from "~/signals";
import { outlinerIsShowing } from "~/pages/PageEnigma/signals/outliner/outliner";
import { ButtonDropdown } from "@storyteller/ui-button-dropdown";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { TestFeaturesButtons } from "./TestFeaturesButtons";
import { LoadUserScenes } from "./LoadUserScenes";
import { getCurrentLocationWithoutParams, isNumberString } from "~/utilities";
import { SceneGenereationMetaData as SceneGenerationMetaData } from "~/pages/PageEnigma/models/sceneGenerationMetadata";
import {
  cameraAspectRatio,
  cinematic,
  enginePreProcessing,
  faceDetail,
  globalIPAMediaToken,
  lipSync,
  resetSceneGenerationMetadata,
  styleStrength,
  upscale,
} from "~/pages/PageEnigma/signals";
import { CameraAspectRatio } from "~/pages/PageEnigma/enums";
import { twMerge } from "tailwind-merge";
import { Help } from "./Help";
import { Modal } from "@storyteller/ui-modal";

export const ControlsTopButtons = () => {
  useSignals();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [helpIsShowing, setHelpIsShowing] = useState(false);
  const editorEngine = useContext(EngineContext);

  const [sceneTitleInput, setSceneTitleInput] = useState<string>("");
  const [sceneTokenSelected, setSceneTokenSelected] = useState<string>("");

  const handleChangeSceneTitleInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSceneTitleInput(e.target.value);
  };

  const handleResetScene = () => {
    resetSceneGenerationMetadata();
    editorEngine?.changeRenderCameraAspectRatio(
      CameraAspectRatio.HORIZONTAL_3_2,
    );
  };

  const getSceneGenereationMetaData = useCallback(
    (editorEngine: EditorExpandedI): SceneGenerationMetaData => {
      // when this is called, editor engine is guarunteed by it's caller
      return {
        positivePrompt: editorEngine.positive_prompt,
        negativePrompt: editorEngine.negative_prompt,
        artisticStyle: getArtStyle(editorEngine.art_style.toString()),
        cameraAspectRatio: cameraAspectRatio.value,
        globalIPAMediaToken: globalIPAMediaToken.value || undefined,
        upscale: upscale.value,
        faceDetail: faceDetail.value,
        styleStrength: styleStrength.value,
        lipSync: lipSync.value,
        cinematic: cinematic.value,
        enginePreProcessing: enginePreProcessing.value,
      };
    },
    [],
  );

  const handleButtonSave = async () => {
    if (!editorEngine) {
      addToast(ToastTypes.ERROR, "No Engine Error in Saving Scenes");
      return;
    }
    const sceneGenerationMetadata = getSceneGenereationMetaData(editorEngine);

    const retSceneMediaToken = await editorEngine.saveScene({
      sceneTitle: scene.value.title || "",
      sceneToken: scene.value.token,
      sceneGenerationMetadata,
    });

    if (retSceneMediaToken === "") {
      addToast(ToastTypes.ERROR, "Failed to Save Scene Try again Later!");
    }

    if (retSceneMediaToken) {
      addToast(ToastTypes.SUCCESS, retSceneMediaToken);
      if (!scene.value.token) {
        signalScene({
          ...scene.value,
          token: retSceneMediaToken,
        });
      }
    }
  };

  const handleButtonSaveAsCopy = useCallback(async () => {
    if (!editorEngine) {
      addToast(ToastTypes.ERROR, "No Engine Error in Saving Scenes");
      return;
    }
    const sceneGenerationMetadata = getSceneGenereationMetaData(editorEngine);
    const retSceneMediaToken = await editorEngine.saveScene({
      sceneTitle: sceneTitleInput,
      sceneToken: undefined,
      sceneGenerationMetadata,
    });
    if (retSceneMediaToken) {
      addToast(ToastTypes.SUCCESS, retSceneMediaToken);
      signalScene({
        ...scene.value,
        token: retSceneMediaToken,
        ownerToken: authentication.userInfo.value?.user_token,
        title: sceneTitleInput,
      });
    }
  }, [sceneTitleInput, editorEngine, getSceneGenereationMetaData]);

  const handleButtonLoadScene = () => {
    handleResetScene();
    editorEngine?.loadScene(sceneTokenSelected).catch((err) => {
      addToast(ToastTypes.ERROR, err.message);
    });
  };

  const handleSceneSelection = (token: string) => {
    setSceneTokenSelected(token);
  };

  useSignalEffect(() => {
    //TODO: USE SIGNAL EFFECT SHOULD BE PERFORM ELSEWHERE
    // WHERE THIS OPERATION IS EXPECTED
    if (!scene.value.isInitializing) {
      setSceneTitleInput(scene.value.title || "");
      const currentLocation = getCurrentLocationWithoutParams(
        location.pathname,
        params,
      );
      if (scene.value.token === undefined) {
        if (params.sceneToken) {
          //case of create new scene from existing scene
          history.pushState({}, "", currentLocation);
        }
        //case of create new scene from unsaved scene
        navigate(currentLocation, { replace: true });
      } else if (scene.value.token) {
        if (params.sceneToken && scene.value.token !== params.sceneToken) {
          //case of loading existing scene from existing scene
          history.pushState({}, "", currentLocation + scene.value.token);
        }
        //case of loading existing scene from unsaved new scene
        //or case of updating existing scene
        navigate(currentLocation + scene.value.token, { replace: true });
      }
    }
  });

  const handleShowOutliner = () => {
    outlinerIsShowing.value = !outlinerIsShowing.value;
  };

  return (
    <div className="flex flex-col gap-2 pl-2 pt-2">
      <div className="flex gap-1.5">
        <ButtonDropdown
          label="File"
          icon={faFile}
          className="shadow-xl"
          options={[
            {
              label: "New scene",
              description: "Ctrl+N",
              onClick: () => {
                setSceneTitleInput("Untitled New Scene");
              },
            },
            {
              label: "Load my scene",
              description: "Ctrl+O",
              dialogProps: {
                title: "Load a Saved Scene",
                content: (
                  <LoadUserScenes onSceneSelect={handleSceneSelection} />
                ),
                confirmButtonProps: {
                  label: "Load",
                  disabled: sceneTokenSelected === "",
                  onClick: handleButtonLoadScene,
                },
                closeButtonProps: {
                  label: "Cancel",
                },
                showClose: true,
                className: "max-w-5xl",
              },
            },
            {
              disabled: !(
                scene.value.isModified &&
                (scene.value.ownerToken === undefined ||
                  scene.value.ownerToken ===
                    authentication.userInfo.value?.user_token)
              ),
              // save scene should be disabled if there are no changes
              label: "Save scene",
              description: "Ctrl+S",
              dialogProps: {
                title: "Save Scene",
                content: (
                  <h4>
                    Save scene to <b>{scene.value.title}</b>?
                  </h4>
                ),
                confirmButtonProps: {
                  label: "Save",
                  onClick: handleButtonSave,
                },
                closeButtonProps: {
                  label: "Cancel",
                },
                showClose: true,
              },
              divider: true,
            },
            {
              disabled: !scene.value.isModified || !scene.value.token,
              label: "Save scene as copy",
              description: "Ctrl+Shift+S",
              onDialogOpen: () => {
                const copyCountStr = sceneTitleInput.substring(
                  sceneTitleInput.lastIndexOf("(") + 1,
                  sceneTitleInput.length - 1,
                );
                if (isNumberString(copyCountStr)) {
                  const newCopyCountStr = String(Number(copyCountStr) + 1);
                  setSceneTitleInput(
                    sceneTitleInput.replace(copyCountStr, newCopyCountStr),
                  );
                } else {
                  setSceneTitleInput(sceneTitleInput + " (1)");
                }
              },
              dialogProps: {
                title: "Save Scene as Copy",
                content: (
                  <Input
                    value={sceneTitleInput}
                    label="Please enter a name for your scene"
                    onChange={handleChangeSceneTitleInput}
                  />
                ),
                confirmButtonProps: {
                  label: "Save",
                  disabled: sceneTitleInput === "",
                  onClick: handleButtonSaveAsCopy,
                },
                closeButtonProps: {
                  label: "Cancel",
                },
                showClose: true,
              },
            },
          ]}
        />

        <Button
          icon={outlinerIsShowing.value ? faCheckSquare : faSquare}
          className="shadow-xl"
          iconClassName={twMerge(
            "text-[16px]",
            outlinerIsShowing.value ? "text-white" : "text-white/20",
          )}
          variant="secondary"
          onClick={handleShowOutliner}
        >
          Outliner
        </Button>

        <Button
          icon={faQuestion}
          variant="secondary"
          className="shadow-xl"
          onClick={() => setHelpIsShowing(true)}
        >
          Help
        </Button>
      </div>
      <TestFeaturesButtons debug={false} />

      <Modal
        isOpen={helpIsShowing}
        onClose={() => setHelpIsShowing(false)}
        title="Help"
        className="h-[500px] max-w-4xl"
      >
        <Help />
      </Modal>
    </div>
  );
};
