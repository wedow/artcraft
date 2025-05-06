import { useEffect, useState } from "react";
import { SoundRegistry, SoundEffect } from "@storyteller/soundboard";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { AppPreferencesPayload, CustomDirectory, GetAppPreferences, SystemDirectory } from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "libs/tauri-api/src/lib/settings/UpdateAppPreference";
import { open } from '@tauri-apps/plugin-dialog';
import { Select, SelectValue } from "libs/components/select/src/lib/select";

// TODO: This is maintained in two places. Here and InstallSounds.
const SOUND_OPTIONS = [
  { value: "flower", label: "Flower" },
  { value: "correct", label: "Correct" },
  { value: "next", label: "Next" },
  { value: "done", label: "Done" },
  { value: "crumble", label: "Crumble" },
];

interface MiscSettingsPaneProps {
}

export const MiscSettingsPane = (args: MiscSettingsPaneProps) => {
  const [preferences, setPreferences] = useState<AppPreferencesPayload|undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppPreferences();
      console.log("prefs", prefs)
      setPreferences(prefs.preferences);
    }
    fetchData();
  }, []);


  // NB: This might be a complex type.
  const outerDownloadObject = preferences?.preferred_download_directory || {};
  const downloadDirectory = ("custom" in outerDownloadObject) ? outerDownloadObject.custom as string : "";
  const currentDownloadLabel = ("system" in outerDownloadObject) ? "System Download Directory" : downloadDirectory;

  const playSounds = preferences?.play_sounds || false;

  const successSound = preferences?.generation_success_sound;
  const failureSound = preferences?.generation_failure_sound;
  const enqueueSound = preferences?.generation_enqueue_sound;

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

  const openDirectoryPicker = async () => {
    let directory = await open({
      multiple: false,
      directory: true,
      defaultPath: downloadDirectory || undefined,
    });
    if (directory === null) {
      return; // User dismissed the dialog choice
    }
    await UpdateAppPreferences({
      preference: PreferenceName.PreferredDownloadDirectory, 
      value: {
        custom: directory
      } as CustomDirectory,
    });
    await reloadPreferences();
  }

  const clearDirectory = async () => {
    await UpdateAppPreferences({
      preference: PreferenceName.PreferredDownloadDirectory, 
      value: {
        system: "downloads" 
      } as SystemDirectory,
    });
    await reloadPreferences();
  }

  const setSuccessSound = async (val: string) => {
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationSuccessSound, 
      value: val,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  }

  const setFailureSound = async (val: string) => {
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationFailureSound, 
      value: val,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  }

  const setEnqueueSound = async (val: string) => {
    await UpdateAppPreferences({
      preference: PreferenceName.GenerationEnqueueSound, 
      value: val,
    });
    SoundRegistry.getInstance().playSound(val);
    await reloadPreferences();
  }

  return (<>
    <div className="space-y-4">
      <div>
        <label htmlFor="download-path" className="mb-2 block">
          Default Download Directory
        </label>
        This is where downloads are placed after downloading.
        The current path is <pre>{currentDownloadLabel}</pre>

        <Button 
          variant="primary" 
          className="py-1"
          onClick={openDirectoryPicker}
        >
            Choose Directory
        </Button>
        <Button 
          variant="secondary" 
          className="py-1"
          onClick={clearDirectory}
        >
            Use Default
        </Button>
      </div>

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
      </div>
    </div>
  </>)
}
