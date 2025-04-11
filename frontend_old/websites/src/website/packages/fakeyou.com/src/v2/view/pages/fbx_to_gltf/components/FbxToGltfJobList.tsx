import React from "react";

import { Analytics } from "common/Analytics";
import InferenceJobsList from "components/layout/InferenceJobsList";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";

export default function FbxToGltfJobList() {
  const failures = (fail = "") => {
    switch (fail) {
      case "sample case":
        return "Sample Case, this should not have been shown";
      default:
        return "Unknown failure";
    }
  };

  return (
    <InferenceJobsList
      {...{
        failures,
        onSelect: () => Analytics.voiceConversionClickDownload(),
        jobType: FrontendInferenceJobType.ConvertFbxtoGltf,
      }}
    />
  );
}
