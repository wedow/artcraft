import { useSignals } from "@preact/signals-react/runtime";
import {
  faArrowDownToLine,
  faPaperPlane,
  faSpinnerThird,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { pageHeight, pageWidth } from "~/signals";
import { editorState, previewSrc } from "~/pages/PageEnigma/signals/engine";
import {
  sidePanelWidth,
  sidePanelVisible,
  stylizeSidePanelWidth,
} from "~/pages/PageEnigma/signals";
import { Button, H3, Tooltip } from "~/components";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const PreviewFrameImage = () => {
  useSignals();
  const [isHorizontal, setIsHorizontal] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = previewSrc.value;
    link.download = `${uuidv4()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const img = new Image();
    img.src = previewSrc.value;
    img.onload = () => {
      setIsHorizontal(img.width > img.height);
    };
  }, [previewSrc.value]);

  if (editorState.value === EditorStates.PREVIEW) {
    if (previewSrc.value === "") {
      return (
        <div
          className="absolute inset-0 h-full w-full bg-ui-panel"
          style={{
            width:
              pageWidth.value -
              (sidePanelVisible.value ? sidePanelWidth.value : 0) -
              75 -
              stylizeSidePanelWidth.value,
            height: pageHeight.value - 56,
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div
              className={twMerge(
                "flex aspect-square w-full max-w-[50%] flex-col items-center justify-center border border-[#3F3F3F] bg-brand-secondary-950",
              )}
            >
              <FontAwesomeIcon icon={faSpinnerThird} spin size="4x" />
              <H3 className="z-20 mt-4 text-white">Generating Image...</H3>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          className="absolute inset-0 h-full w-full bg-ui-panel"
          style={{
            width:
              pageWidth.value -
              (sidePanelVisible.value ? sidePanelWidth.value : 0) -
              75 -
              stylizeSidePanelWidth.value,
            height: pageHeight.value - 56,
          }}
        >
          <div className="flex h-full w-full items-center justify-center">
            <div
              className={twMerge(
                "relative h-fit border border-[#3F3F3F]",
                isHorizontal ? "max-w-[70%]" : "max-w-[50%]",
              )}
            >
              <img
                alt="preview of the art style that renders over the 3d scene"
                src={previewSrc.value}
                className="h-full w-full object-contain"
              />
              <div className="absolute right-[-52px] top-0 flex flex-col gap-2">
                <Tooltip content="Save" position="right">
                  <Button
                    icon={faArrowDownToLine}
                    className="h-11 w-11"
                    variant="secondary"
                    onClick={handleDownload}
                  />
                </Tooltip>
                {/* <Tooltip content="Share" position="right">
                  <Button
                    icon={faPaperPlane}
                    className="h-11 w-11"
                    variant="secondary"
                  />
                </Tooltip> */}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
  return null;
};
