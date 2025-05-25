import { useEffect, useState } from "react";
import {
  GetBuildInfo,
  GetBuildInfoPayload,
} from "@storyteller/tauri-api";
import { Label } from "@storyteller/ui-label";

interface AboutSettingsPaneProps {}

export const AboutSettingsPane = (args: AboutSettingsPaneProps) => {
  const [buildInfo, setBuildInfo] = useState<
    GetBuildInfoPayload | undefined
  >(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const prefs = await GetBuildInfo();
      setBuildInfo(prefs.payload);
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
          <div>{buildInfo?.build_timestamp}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Git Commit ID</Label>
          <div>{buildInfo?.git_commit_id}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Git Commit Short ID</Label>
          <div>{buildInfo?.git_commit_short_id}</div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="success-sound">Git Commit Timestamp</Label>
          <div>{buildInfo?.git_commit_timestamp}</div>
        </div>
      </div>
    </>
  );
};
