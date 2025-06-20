import { useEffect, useState } from "react";
import {
  GetAppInfo,
  GetAppInfoPayload,
} from "@storyteller/tauri-api";
import { Label } from "@storyteller/ui-label";

interface AboutSettingsPaneProps {}

export const AboutSettingsPane = (args: AboutSettingsPaneProps) => {
  const [appInfo, setAppInfo] = useState<
    GetAppInfoPayload | undefined
  >(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetAppInfo();
      setAppInfo(prefs.payload);
    };
    fetchData();
  }, []);


  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col">
          <Label htmlFor="play-sounds">
            Build Timestamp
          </Label>
          <div>{appInfo?.build_timestamp}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Git Commit ID</Label>
          <div>{appInfo?.git_commit_id}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Git Commit Short ID</Label>
          <div>{appInfo?.git_commit_short_id}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Git Commit Timestamp</Label>
          <div>{appInfo?.git_commit_timestamp}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Artcraft Host</Label>
          <div>{appInfo?.storyteller_host}</div>
        </div>
      </div>
    </>
  );
};
