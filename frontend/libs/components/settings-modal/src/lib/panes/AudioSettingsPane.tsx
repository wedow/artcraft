import { useEffect, useState } from "react";
import { SoundRegistry } from "@storyteller/soundboard";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { AppPreferencesPayload, GetAppPreferences } from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "@storyteller/tauri-api";
import { Select, SelectValue } from "@storyteller/ui-select";

// TODO: This is maintained in two places. Here and InstallSounds.
const SOUND_OPTIONS = [
  { value: "none", label: "None (Silent)" },
  { value: "flower", label: "Flower" },
  { value: "correct", label: "Correct" },
  { value: "next", label: "Next" },
  { value: "done", label: "Done" },
  { value: "crumble", label: "Crumble" },
];

interface AudioSettingsPaneProps {
}

export const AudioSettingsPane = (args: AudioSettingsPaneProps) => {
  const [preferences, setPreferences] = useState<AppPreferencesPayload|undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppPreferences();
      console.log("prefs", prefs)
      setPreferences(prefs.preferences);
    }
    fetchData();
  }, []);


  const playSounds = preferences?.play_sounds || false;

  const successSound = orNone(preferences?.generation_success_sound);
  const failureSound = orNone(preferences?.generation_failure_sound);
  const enqueueSound = orNone(preferences?.generation_enqueue_sound);

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    console.log("prefs", prefs)
    setPreferences(prefs.preferences);
  }

  const setPlaySounds = async (checked: boolean) => {
    //const value = checked ? "true" : "false";
    await UpdateAppPreferences({
      preference: PreferenceName.PlaySounds, 
      value: checked,
    });
    await reloadPreferences();
  }

  const setSuccessSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationSuccessSound, 
      value: sendVal,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  }

  const setFailureSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationFailureSound, 
      value: sendVal,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  }

  const setEnqueueSound = async (val: string) => {
    let sendVal = val === "none" ? undefined : val;
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationEnqueueSound, 
      value: sendVal,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  }

  const playSound = (val?: string) => {
    if (val !== undefined && val !== "none") {
      SoundRegistry.getInstance().playSound(val);
    }
  }

  return (<>
    <div className="space-y-4">
      <div>
        <label htmlFor="play-sounds" className="mb-2 block">
          Play Notification Sounds for Events?
        </label>
        <Input
            id="play-sounds"
            type="checkbox"
            checked={playSounds}
            onChange={(e) => setPlaySounds((e.target as any).checked)}
        />
      </div>

      <div>
        <label htmlFor="success-sound" className="mb-2 block">
          Success Sound
        </label>
        <Select
            id="success-sound"
            value={successSound}
            onChange={(val: SelectValue) =>
                setSuccessSound(val as string)
            }
            options={SOUND_OPTIONS}
        />
        <Button 
          variant="secondary" 
          className="py-1"
          onClick={() => playSound(successSound)}
        >
            Play
        </Button>
      </div>

      <div>
        <label htmlFor="failure-sound" className="mb-2 block">
          Failure Sound
        </label>
        <Select
            id="failure-sound"
            value={failureSound}
            onChange={(val: SelectValue) =>
                setFailureSound(val as string)
            }
            options={SOUND_OPTIONS}
        />
        <Button 
          variant="secondary" 
          className="py-1"
          onClick={() => playSound(failureSound)}
        >
            Play
        </Button>
      </div>

      <div>
        <label htmlFor="enqueue-sound" className="mb-2 block">
          Enqueue Sound
        </label>
        <Select
            id="enqueue-sound"
            value={enqueueSound}
            onChange={(val: SelectValue) =>
                setEnqueueSound(val as string)
            }
            options={SOUND_OPTIONS}
        />
        <Button 
          variant="secondary" 
          className="py-1"
          onClick={() => playSound(enqueueSound)}
        >
            Play
        </Button>
      </div>
    </div>
  </>)
}

const orNone = (val: string | undefined | null) : string => {
  if (!!!val) {
    return "none";
  }
  return val;
}
