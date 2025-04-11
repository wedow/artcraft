import { DeviceNotSupported } from "components/common";
import React from "react";

export default function StudioMobileCheckPage() {
  return (
    <div className="mt-5">
      <DeviceNotSupported
        showRemixScenes={false}
        showVST={true}
        showButton={false}
      />
    </div>
  );
}
