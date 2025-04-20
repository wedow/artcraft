import { faAngleDown, faAngleUp } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useMemo } from "react";
import { TrackClips } from "~/pages/PageEnigma/comps/Timeline/TrackClips";
import { TrackKeyFrames } from "~/pages/PageEnigma/comps/Timeline/TrackKeyFrames";
import { CharacterTrack } from "~/pages/PageEnigma/models";
import {
  filmLength,
  frameTrackButtonWidthPx,
  fullWidth,
  minimizeIconPosition,
  scale,
  toggleCharacterMinimized,
  updateCharacters
} from "~/pages/PageEnigma/signals";

import { ClipGroup, ClipType } from "~/enums";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";

function buildUpdaters(
  updateCharacters: (options: {
    type: ClipType;
    id: string;
    length: number;
    offset: number;
  }) => void,
) {
  function updateClipAnimations(options: {
    id: string;
    length: number;
    offset: number;
  }) {
    updateCharacters({ ...options, type: ClipType.ANIMATION });
  }

  function updateClipPosition(options: { id: string; offset: number }) {
    updateCharacters({
      ...options,
      length: 0,
      type: ClipType.TRANSFORM,
    });
  }

  function updateClipEmotions(options: {
    id: string;
    length: number;
    offset: number;
  }) {
    updateCharacters({ ...options, type: ClipType.EXPRESSION });
  }

  function updateClipLipSync(options: {
    id: string;
    length: number;
    offset: number;
  }) {
    updateCharacters({ ...options, type: ClipType.AUDIO });
  }
  return {
    updateClipLipSync,
    updateClipPosition,
    updateClipAnimations,
    updateClipEmotions,
  };
}

interface Props {
  character: CharacterTrack;
}

export const Character = ({ character }: Props) => {
  const editorEngine = useContext(EngineContext);

  const {
    updateClipLipSync,
    updateClipPosition,
    updateClipAnimations,
    updateClipEmotions,
  } = useMemo(() => buildUpdaters(updateCharacters), []);

  const {
    animationClips,
    positionKeyframes,
    lipSyncClips,
    expressionClips,
    minimized,
  } = character;

  if (minimized) {
    return (
      <div
        id={`track-character-${character.object_uuid}`}
        className="relative flex h-[30px] items-center justify-end rounded-r-lg bg-character-groupBg pr-4 box-content"
        style={{ width: filmLength.value * 1000 * 4 * scale.value + frameTrackButtonWidthPx * 2 }}
      >
        <button
          className="absolute"
          style={{
            right: minimizeIconPosition.value,
          }}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            toggleCharacterMinimized(character.object_uuid);
          }}
        >
          <FontAwesomeIcon icon={faAngleDown} />
        </button>
      </div>
    );
  }

  return (
    <div
      id={`track-character-${character.object_uuid}`}
      className="relative block rounded-r-lg bg-character-groupBg pb-2 pr-4"
    >
      <div className="flex h-[30px] items-center justify-end">
        <button
          className="absolute"
          style={{
            right: minimizeIconPosition.value,
          }}
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            toggleCharacterMinimized(character.object_uuid);
          }}
        >
          <FontAwesomeIcon icon={faAngleUp} />
        </button>
      </div>
      <div className="flex flex-col">
        <TrackClips
          id={character.object_uuid}
          clips={animationClips}
          updateClip={updateClipAnimations}
          group={ClipGroup.CHARACTER}
          type={ClipType.ANIMATION}
        />
        <TrackKeyFrames
          id={character.object_uuid}
          keyframes={positionKeyframes}
          updateKeyframe={updateClipPosition}
          group={ClipGroup.CHARACTER}
        />
      </div>
    </div>
  );
};
