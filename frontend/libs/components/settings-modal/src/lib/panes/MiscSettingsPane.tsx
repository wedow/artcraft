import { useEffect, useState } from "react";
import { Button } from "@storyteller/ui-button";
import { AppPreferencesPayload, CustomDirectory, GetAppPreferences, SystemDirectory } from "@storyteller/tauri-api";
import { PreferenceName, UpdateAppPreferences } from "@storyteller/tauri-api";
import { open } from '@tauri-apps/plugin-dialog';

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

  const reloadPreferences = async () => {
    const prefs = await GetAppPreferences();
    console.log("prefs", prefs)
    setPreferences(prefs.preferences);
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

    </div>
  </>)
}
