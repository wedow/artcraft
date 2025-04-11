import { faImage, faTrashCan } from "@fortawesome/pro-solid-svg-icons";
import { ButtonIconStack } from "~/components/reusable/ButtonIconStack";
import { frameTrackButtonWidthPx } from "../../signals";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { EngineContext } from "../../contexts/EngineContext";
import { CHARACTER_FRAME_FILE_TYPE } from "~/enums";
import { UploadModalMedia } from "~/components/reusable/UploadModalMedia";
import { UploadImageMediaModal } from "~/components/reusable/UploadModalMedia/UploadImageMediaModal";
import { MediaFilesApi } from "~/Classes/ApiManager";
import { MediaFile } from "../../models";
import { ApiResponse } from "~/Classes/ApiManager/ApiManager";
import { get_media_url } from "~/Classes/ApiHelpers";
import { twMerge } from "tailwind-merge";
import { ButtonIcon } from "~/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// TODO(bt,2025-01-28): This is just a temporary flag
const TODO_REMOVE_RUN_POSE_CALCULATION = false;

export enum CharacterFrameTarget {
  Start,
  End
}

export interface CharacterFrameButtonProps {
  target: CharacterFrameTarget;
  characterId: string;
  className?: string;
}

export const CharacterFrameStrings = {
  [CharacterFrameTarget.Start]: "Start Frame",
  [CharacterFrameTarget.End]: "End Frame"
}

export default function CharacterFrameButton(
  {
    target,
    characterId,
    className,
  }: CharacterFrameButtonProps
) {

  const clickable = useRef(true);
  const editorEngine = useContext(EngineContext);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [mediaFile, setMediaFile] = useState<string | undefined>(undefined);

  const handleFrameClick = useCallback(() => {
    if (!clickable.current) {
      return;
    }

    // Make button unresponsive to clicks until modal is closed
    clickable.current = false;
    setIsUploadModalOpen(true);
  }, [])


  const unlockButton = useCallback(() => {
    clickable.current = true;
    setIsUploadModalOpen(false);
  }, [setIsUploadModalOpen]);

  const handleFrameSet = useCallback((token?: string) => {
    if (!token) {
      console.error("No image media file token to set as first frame");
      return;
    }

    // TODO(brandon,2024-01-27): Please forgive me for this ugly hack. It's just 
    // temporary to move to integration testing quickly. Setting the media token 
    // to a global space so we can read from it when calling the inference API.
    console.log(`Setting image media file token as first frame token: ${token}`);
    (window as any).firstFrameMediaToken = token;

    // TODO: Fetch the image and pass the token to the character engine

    // Fetch the image and set as button bg
    get_media_url(token)
      .then(async (url) => {
        console.debug("Frame url: ", url)

        setMediaFile(url);

        // TODO(brandon,2024-01-27): Please forgive me for this ugly hack. It's just 
        // temporary to move to integration testing quickly. Setting the media token 
        // to a global space so we can read from it when calling the inference API.
        (window as any).firstFrameMediaUrl = url;

        // TODO(brandon,2024-01-27): TEMPORARY EXPERIMENT. REMOVE ME.
        // TODO(brandon,2024-01-27): TEMPORARY EXPERIMENT. REMOVE ME.
        // TODO(brandon,2024-01-27): TEMPORARY EXPERIMENT. REMOVE ME.
        // await testGlobalExperiment();
      })
      .catch((error) => {
        console.error("Error fetching media file", error);
      })
      .finally(() => {
        unlockButton();
      })

  }, [unlockButton]);

  const handleDeleteFrame = useCallback(() => {
    const character = editorEngine!.timeline.scene.get_object_by_uuid(characterId)!;
    editorEngine!.animation_engine.clearStartFrame(
      character,
      editorEngine!.timeline.current_time,
      editorEngine!.timeline.timeline_limit
    );

    setMediaFile(undefined);
    unlockButton();
  }, [unlockButton, setMediaFile, characterId, editorEngine]);


  if (!mediaFile) {
    return (
      <>
        <div className={className} style={{ minWidth: frameTrackButtonWidthPx, width: frameTrackButtonWidthPx }}>
          <ButtonIconStack icon={faImage} additionalStyle="bg-character-frame" text={CharacterFrameStrings[target]} onClick={handleFrameClick} />
        </div>
        <UploadImageMediaModal
          isOpen={isUploadModalOpen}
          onClose={unlockButton}
          onSuccess={handleFrameSet}
          title={"Upload Character Frame Image"}
          fileTypes={Object.values(CHARACTER_FRAME_FILE_TYPE)}
        />
      </>
    )
  } else {
    const classes = twMerge([
      className,
      "bg-character-unselected overflow-hidden"
    ]);

    const buttonClasses = twMerge([
      "absolute flex box-content top-1 right-1 w-6 h-6 rounded-md invisible group-hover:visible items-center justify-center",
      "bg-gray-800 hover:bg-red text-gray-500 hover:text-gray-100 border-2 border-transparent hover:border-white",
      "transition-all duration-150",
    ])

    return (
      <>
        <div className={classes} style={{ minWidth: frameTrackButtonWidthPx, width: frameTrackButtonWidthPx }}>
          <div className={"rounded-md w-full h-full relative group border-2 border-gray-400"}>
            <img crossOrigin="anonymous" src={mediaFile} alt={CharacterFrameStrings[target]} className={"rounded-md object-cover w-full h-full"} />
            <button className={buttonClasses} onClick={handleDeleteFrame}>
              <FontAwesomeIcon icon={faTrashCan} size={"xs"} className={""} />
            </button>
          </div>
        </div>
      </>
    )
  }
}
