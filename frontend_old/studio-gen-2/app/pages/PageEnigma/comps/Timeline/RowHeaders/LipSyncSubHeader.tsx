import { useContext } from "react";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import { toggleLipSyncMute } from "~/pages/PageEnigma/signals";
import { faVolume, faVolumeSlash } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CharacterTrack } from "~/pages/PageEnigma/models";

export const LipSyncSubHeader = ({
  character,
}: {
  character: CharacterTrack;
}) => {
  const editorEngine = useContext(EngineContext);
  if (editorEngine && editorEngine.isObjectLipsync(character.object_uuid)) {
    return (
      <div className="mb-1 flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
        <div className="flex gap-3">
          Vocal / Speech
          <button
            className="text-md text-white transition-colors duration-100 hover:text-white/80"
            onClick={() => toggleLipSyncMute(character.object_uuid)}
          >
            {character.muted ? (
              <FontAwesomeIcon
                icon={faVolumeSlash}
                className="text-brand-primary transition-colors duration-100 hover:text-brand-primary/80"
              />
            ) : (
              <FontAwesomeIcon icon={faVolume} />
            )}
          </button>
        </div>
      </div>
    );
  }
  return null;
};
