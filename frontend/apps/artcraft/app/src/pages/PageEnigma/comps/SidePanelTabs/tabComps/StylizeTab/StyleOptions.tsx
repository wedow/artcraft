import { PremiumLock } from "~/components";
import { useSignals } from "@preact/signals-react/runtime";
import { Switch } from "@headlessui/react";

import {
  faceDetail,
  upscale,
  lipSync,
  cinematic,
  enginePreProcessing,
} from "~/pages/PageEnigma/signals/stylizeTab";
import { twMerge } from "tailwind-merge";

import { useContext } from "react";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";

export function StyleOptions() {
  useSignals();
  const editorEngine = useContext(EngineContext);

  const handleCinematicChange = () => {
    cinematic.value = !cinematic.value;
    if (cinematic.value) {
      upscale.value = false;
    }
  };

  const enginePreProcessingChange = () => {
    enginePreProcessing.value = !enginePreProcessing.value;
    if (editorEngine) {
      editorEngine.engine_preprocessing = enginePreProcessing.value;
    }
  };

  const handleUpscaleChange = () => {
    upscale.value = !upscale.value;
    if (upscale.value) {
      cinematic.value = false;
    }
  };

  const handleLipsyncChange = () => {
    lipSync.value = !lipSync.value;
  };

  const handleFaceDetailerChange = () => {
    faceDetail.value = !faceDetail.value;
  };

  return (
    <div className="flex w-full flex-col justify-center gap-4 rounded-b-lg bg-ui-panel">
      <div className="w-full">
        <div>
          <div className="flex items-center py-[6px]">
            <Switch.Group>
              <Switch.Label
                className={twMerge(
                  "mr-3 grow text-sm font-medium transition-opacity",
                )}
              >
                Sync Lips with Speech
              </Switch.Label>
              <Switch
                checked={lipSync.value}
                onChange={handleLipsyncChange}
                className={twMerge(
                  lipSync.value
                    ? "bg-brand-primary hover:bg-brand-primary-400"
                    : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                  "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                )}
              >
                <span
                  className={`${
                    lipSync.value ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </Switch.Group>
            <hr className="opacity-[5%]" />
          </div>
        </div>
        <PremiumLock requiredPlan="any" plural={true} className="mt-2">
          <div className="flex flex-col gap-[6px]">
            <hr className="opacity-[5%]" />
            <div className="flex w-full items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                  )}
                >
                  Face Detailer
                </Switch.Label>
                <Switch
                  checked={faceDetail.value}
                  onChange={handleFaceDetailerChange}
                  className={twMerge(
                    faceDetail.value
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      faceDetail.value ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>

            <hr className="opacity-[5%]" />
            <div className="flex w-full items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                    cinematic.value ? "opacity-50" : "",
                  )}
                >
                  Upscale
                </Switch.Label>
                <Switch
                  checked={upscale.value}
                  onChange={handleUpscaleChange}
                  className={twMerge(
                    upscale.value
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      upscale.value ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>
            <hr className="opacity-[5%]" />
            <div className="flex items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                    upscale.value ? "opacity-50" : "",
                  )}
                >
                  Use Cinematic
                </Switch.Label>
                <Switch
                  checked={cinematic.value}
                  onChange={handleCinematicChange}
                  className={twMerge(
                    cinematic.value
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      cinematic.value ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>
            <hr className="opacity-[5%]" />
            <div className="flex w-full items-center">
              <Switch.Group>
                <Switch.Label
                  className={twMerge(
                    "mr-3 grow text-sm font-medium transition-opacity",
                  )}
                >
                  Engine Preprocessing
                </Switch.Label>
                <Switch
                  checked={enginePreProcessing.value}
                  onChange={enginePreProcessingChange}
                  className={twMerge(
                    enginePreProcessing.value
                      ? "bg-brand-primary hover:bg-brand-primary-400"
                      : "bg-brand-secondary-800 hover:bg-brand-secondary-600",
                    "focus:ring-indigo-500 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0",
                  )}
                >
                  <span
                    className={`${
                      enginePreProcessing.value
                        ? "translate-x-6"
                        : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </Switch.Group>
            </div>
            <hr className="opacity-[5%]" />
          </div>
        </PremiumLock>
      </div>
    </div>
  );
}
