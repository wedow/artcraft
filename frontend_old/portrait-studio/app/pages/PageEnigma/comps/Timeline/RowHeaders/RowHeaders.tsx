import {
  audioGroup,
  audioMinimized,
  cameraMinimized,
  characterGroup,
  objectGroup,
  objectsMinimized,
  timelineScrollY,
  toggleAudioMute,
} from "~/pages/PageEnigma/signals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVolume, faVolumeSlash } from "@fortawesome/pro-solid-svg-icons";
import { useSignals } from "@preact/signals-react/runtime";
import { GlobalAudioHeader } from "~/pages/PageEnigma/comps/Timeline/RowHeaders/GlobalAudioHeader";
import { CameraHeader } from "~/pages/PageEnigma/comps/Timeline/RowHeaders/CameraHeader";
import { ObjectsHeader } from "~/pages/PageEnigma/comps/Timeline/RowHeaders/ObjectsHeader";
import { CharacterHeader } from "~/pages/PageEnigma/comps/Timeline/RowHeaders/CharacterHeader";
import { LipSyncSubHeader } from "./LipSyncSubHeader";
import { MediaFileAnimationType } from "~/enums";
import { MediaFileType } from "~/pages/PageEnigma/enums";
import { currentPage } from "~/signals";
import { Pages } from "~/pages/PageEnigma/constants/page";
import { PromptTravelHeader } from "~/pages/PageEnigma/comps/Timeline/RowHeaders/PromptTravelHeader";

export const RowHeaders = () => {
  useSignals();

  const compressedHeaderClasses =
    "flex h-[30px] items-center gap-2 pl-2 text-xs rounded-tl-lg font-medium text-white w-32";
  const uncompressedHeaderClasses =
    "flex h-[30px] items-center gap-2 rounded-br-lg rounded-tl-lg pl-2 text-xs font-medium text-white w-32";

  if (currentPage.value === Pages.STYLE) {
    return (
      <div className="relative">
        <div className="absolute mt-2 w-[146px]" style={{ top: -8 }}>
          <div className="mb-1 h-[72px] w-full rounded-l-lg bg-prompt-groupBg">
            <div className="h-[30px]  text-xs font-medium text-white">
              <div
                className={[
                  uncompressedHeaderClasses,
                  "bg-prompt-titleBg",
                ].join(" ")}
              >
                <PromptTravelHeader />
              </div>
            </div>
            <div className="flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
              Text Prompt
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="absolute mt-2 w-[146px]"
        style={{ top: timelineScrollY.value * -1 - 8 }}
      >
        {characterGroup.value.characters.map((character) => {
          if (character.minimized) {
            return (
              <div
                key={character.object_uuid}
                className="mb-1 h-[30px] w-full rounded-l-lg bg-character-groupBg"
              >
                <div
                  className={[
                    compressedHeaderClasses,
                    "bg-character-titleBg",
                  ].join(" ")}
                >
                  <CharacterHeader name={character.name} />
                </div>
              </div>
            );
          }
          return (
            <div
              key={character.object_uuid}
              className="mb-1 w-full rounded-l-lg bg-character-groupBg pb-2"
            >
              <div className="h-[30px]  text-xs font-medium text-white">
                <div
                  className={[
                    uncompressedHeaderClasses,
                    "bg-character-titleBg",
                  ].join(" ")}
                >
                  <CharacterHeader name={character.name} />
                </div>
              </div>
              <div className="mb-1 flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
                Animation
              </div>
              <div className="mb-1 flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
                Position
              </div>
              {(character.animationType === MediaFileAnimationType.Mixamo ||
                character.mediaType === MediaFileType.GLB) && (
                <div className="mb-1 flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
                  Expression
                </div>
              )}
              <LipSyncSubHeader character={character} />
            </div>
          );
        })}

        {cameraMinimized.value ? (
          <div className="mb-1 h-[30px] w-full rounded-l-lg bg-camera-groupBg">
            <div
              className={[compressedHeaderClasses, "bg-camera-titleBg"].join(
                " ",
              )}
            >
              <CameraHeader />
            </div>
          </div>
        ) : (
          <div className="mb-1 h-[72px] w-full rounded-l-lg bg-camera-groupBg">
            <div className="h-[30px]  text-xs font-medium text-white">
              <div
                className={[
                  uncompressedHeaderClasses,
                  "bg-camera-titleBg",
                ].join(" ")}
              >
                <CameraHeader />
              </div>
            </div>
            <div className="flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
              Position
            </div>
          </div>
        )}

        {audioMinimized.value ? (
          <div className="mb-1 h-[30px] w-full rounded-l-lg bg-global_audio-groupBg">
            <div
              className={[
                compressedHeaderClasses,
                "bg-global_audio-titleBg",
              ].join(" ")}
            >
              <GlobalAudioHeader />
            </div>
          </div>
        ) : (
          <div className="mb-1 h-[72px] w-full rounded-l-lg bg-global_audio-groupBg">
            <div className="h-[30px]  text-xs font-medium text-white">
              <div
                className={[
                  uncompressedHeaderClasses,
                  "bg-global_audio-titleBg",
                ].join(" ")}
              >
                <GlobalAudioHeader />
              </div>
            </div>
            <div className="flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80">
              <div className="flex gap-3">
                Track 1
                <button
                  className="text-md text-white transition-colors duration-100 hover:text-white/80"
                  onClick={() => toggleAudioMute()}
                >
                  {audioGroup.value.muted ? (
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
          </div>
        )}
        {objectGroup.value.objects.length > 0 && (
          <>
            {objectsMinimized.value ? (
              <div className="h-[30px] w-full rounded-l-lg bg-object-groupBg">
                <div
                  className={[
                    compressedHeaderClasses,
                    "bg-object-titleBg",
                  ].join(" ")}
                >
                  <ObjectsHeader />
                </div>
              </div>
            ) : (
              <div
                className="mb-1 h-[72px] w-full rounded-l-lg bg-object-groupBg"
                style={{
                  height: `${38 + objectGroup.value.objects.length * 34}px`,
                }}
              >
                <div className="h-[30px] text-xs font-medium text-white">
                  <div
                    className={[
                      uncompressedHeaderClasses,
                      "bg-object-titleBg",
                    ].join(" ")}
                  >
                    <ObjectsHeader />
                  </div>
                </div>
                {objectGroup.value.objects.map((obj) => (
                  <div
                    key={obj.object_uuid}
                    className="mb-1 flex h-[30px] flex-col justify-center pl-[22px] text-xs font-medium text-white opacity-80"
                  >
                    {obj.name}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
