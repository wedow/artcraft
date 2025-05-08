import { useEffect, useState } from "react";
import { SoundRegistry } from "@storyteller/soundboard";
import { Button } from "@storyteller/ui-button";
import { faPlay } from "@fortawesome/pro-solid-svg-icons";
import {
  AppPreferencesPayload,
  GetAppPreferences,
} from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "@storyteller/tauri-api";
import { Select, SelectValue } from "@storyteller/ui-select";
import { Switch } from "@storyteller/ui-switch";
import { Label } from "@storyteller/ui-label";

// TODO: This is maintained in two places. Here and InstallSounds.
const SOUND_OPTIONS = [
  { value: "none", label: "None (Silent)" },
  { value: "flower", label: "Flower" },
  { value: "correct", label: "Correct" },
  { value: "next", label: "Next" },
  { value: "done", label: "Done" },
  { value: "crumble", label: "Crumble" },
];

interface AudioSettingsPaneProps {}

export const AudioSettingsPane = (args: AudioSettingsPaneProps) => {
  const [preferences, setPreferences] = useState<
    AppPreferencesPayload | undefined
  >(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppPreferences();
      setPreferences(prefs.preferences);
    };
    fetchData();
  }, []);

  const playSounds = preferences?.play_sounds || false;

  const successSound = orNone(preferences?.generation_success_sound);
  const failureSound = orNone(preferences?.generation_failure_sound);
  const enqueueSound = orNone(preferences?.generation_enqueue_sound);

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    setPreferences(prefs.preferences);
  };

  const setPlaySounds = async (checked: boolean) => {
    //const value = checked ? "true" : "false";
    await UpdateAppPreferences({
      preference: PreferenceName.PlaySounds,
      value: checked,
    });
    await reloadPreferences();
  };

  const setSuccessSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationSuccessSound,
      value: sendVal,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  };

  const setFailureSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationFailureSound,
      value: sendVal,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  };

  const setEnqueueSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationEnqueueSound,
      value: sendVal,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  };

  const playSound = (val?: string) => {
    if (val !== undefined && val !== "none") {
      SoundRegistry.getInstance().playSound(val);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="play-sounds">
            Play Notification Sounds for Events?
          </Label>
          <Switch enabled={playSounds} setEnabled={setPlaySounds} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Success Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="success-sound"
              value={successSound}
              onChange={(val: SelectValue) => setSuccessSound(val as string)}
              options={SOUND_OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(successSound)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="failure-sound">Failure Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="failure-sound"
              value={failureSound}
              onChange={(val: SelectValue) => setFailureSound(val as string)}
              options={SOUND_OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(failureSound)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="enqueue-sound">Enqueue Sound</Label>
          <div className="flex items-center gap-2">
            <Select
              id="enqueue-sound"
              value={enqueueSound}
              onChange={(val: SelectValue) => setEnqueueSound(val as string)}
              options={SOUND_OPTIONS}
              className="grow"
            />
            <Button
              variant="primary"
              className="w-[40px] h-[40px]"
              icon={faPlay}
              onClick={() => playSound(enqueueSound)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const orNone = (val: string | undefined | null): string => {
  if (!!!val) {
    return "none";
  }
  return val;
};
