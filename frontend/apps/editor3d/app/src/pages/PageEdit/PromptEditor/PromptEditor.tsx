import React from "react";
import { PromptEditorProps } from "./types";
import { PromptBoxEdit } from "@storyteller/ui-promptbox";
import { uploadImage } from "../../../components/reusable/UploadModalMedia/uploadImage";

// Set this value on when enqueue is pressed nasty global variable.
import { getCanvasRenderBitmap } from "../../../signals/canvasRenderBitmap"
import { JobProvider, useJobContext } from "~/pages/PageDraw/JobContext";
import { EncodeImageBitmapToBase64 } from "~/pages/PageDraw/utilities/EncodeImageBitmapToBase64";
const PromptEditor: React.FC<PromptEditorProps> = ({
  onEnqueuePressed,
  onModeChange,
  selectedMode,
}) => {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col space-y-2">
      <div className="flex w-full justify-center">
      </div>

      <JobProvider>
        <PromptBoxEdit
          uploadImage={uploadImage}
          getCanvasRenderBitmap={getCanvasRenderBitmap}
          EncodeImageBitmapToBase64={EncodeImageBitmapToBase64}
          useJobContext={useJobContext}
          onEnqueuePressed={onEnqueuePressed}
          onModeSelectionChange={onModeChange}
          selectedMode={selectedMode}
        />
      </JobProvider>
    </div>
  );
};

export default PromptEditor;
