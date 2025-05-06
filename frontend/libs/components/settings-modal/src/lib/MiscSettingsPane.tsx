import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { AppPreferencesPayload, GetAppPreferences, CustomDirectory } from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "libs/tauri-api/src/lib/settings/UpdateAppPreference";
import { open } from '@tauri-apps/plugin-dialog';

// NB: On the backend, we expand "$default" to mean the default system download dir.
const DEFAULT_SYSTEM_DOWNLOAD_DIRECTORY_SIGIL = "$default";

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
  const downloadDirectorySpec = preferences?.preferred_download_directory || DEFAULT_SYSTEM_DOWNLOAD_DIRECTORY_SIGIL;
  const downloadDirectory = (typeof downloadDirectorySpec === "string")? downloadDirectorySpec : downloadDirectorySpec.custom;

  const playSounds = preferences?.play_sounds || false;

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    console.log("prefs", prefs)
    setPreferences(prefs.preferences);
  }

  const setPlaySounds = async (checked: boolean) => {
    const value = checked ? "true" : "false";
    await UpdateAppPreferences({
      preference: PreferenceName.PlaySounds, 
      value: value,
    });
    await reloadPreferences();
  }

  const openDirectoryPicker = async () => {
    let defaultPath = downloadDirectory || undefined;

    let directory = await open({
      multiple: false,
      directory: true,
      defaultPath: defaultPath,
    });

    if (directory === null) {
      return;
    }

    await UpdateAppPreferences({
      preference: PreferenceName.PreferredDownloadDirectory, 
      value: directory,
    });

    await reloadPreferences();
  }

  return (<>
    <div className="space-y-4">
      <div>
        <label htmlFor="pal-api-key" className="mb-2 block">
          Default Download Directory
        </label>


        <Button 
          variant="primary" 
          className="py-1"
          onClick={openDirectoryPicker}
        >
            Choose Directory
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
    </div>
  </>)
}
