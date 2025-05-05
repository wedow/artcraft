import { useEffect, useState } from "react";
import { Input } from "@storyteller/ui-input";
import { AppPreferencesPayload, GetAppPreferences } from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "libs/tauri-api/src/lib/settings/UpdateAppPreference";

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

  const downloadDirectory = preferences?.preferred_download_directory || "(default)";
  const playSounds = preferences?.play_sounds || false;

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    console.log("prefs", prefs)
    setPreferences(prefs.preferences);
  }

  const setDownloadDirectory = async (value: string) => {
    await UpdateAppPreferences({
      preference: PreferenceName.PreferredDownloadDirectory, 
      value: value,
    });
    await reloadPreferences();
  }

  const setPlaySounds = async (checked: boolean) => {
    const value = checked ? "true" : "false";
    await UpdateAppPreferences({
      preference: PreferenceName.PlaySounds, 
      value: value,
    });
    await reloadPreferences();
  }

  return (<>
    <div className="space-y-4">
      <div>
        <label htmlFor="pal-api-key" className="mb-2 block">
          Default Download Directory
        </label>
        <Input
            id="pal-api-key"
            type="input"
            value={downloadDirectory}
            onChange={(e) => setDownloadDirectory((e.target as any).value)}
            placeholder="Enter API Key"
        />
      </div>
      <div>
        <label htmlFor="play-sounds" className="mb-2 block">
          Play Sounds for Events?
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
