import { useSignals } from "@preact/signals-react/runtime";
import { twMerge } from "tailwind-merge";

import { EditorStates } from "~/pages/PageEnigma/enums";
import { editorState, cameraAspectRatio } from "~/pages/PageEnigma/signals";

import {
  calcMatteWidth,
  calcMatteHeight,
  getMatteOrientation,
  MatteOrientation,
} from "./helpers";

export const Letterbox = ({
  isShowing,
  width,
  height,
}: {
  isShowing: boolean;
  width: number;
  height: number;
}) => {
  useSignals();

  // if (editorState.value !== EditorStates.CAMERA_VIEW || !isShowing) {
  //   //case of Letterbox should not show
  //   return;
  // }

  const matteOri = getMatteOrientation({
    camAspect: cameraAspectRatio.value,
    width,
    height,
  });

  const matteWidth = calcMatteWidth({
    matteOri,
    camAspect: cameraAspectRatio.value,
    width,
    height,
  });

  const matteHeight = calcMatteHeight({
    matteOri,
    camAspect: cameraAspectRatio.value,
    width,
    height,
  });

  return (
    <div
      id="letterbox"
      className={twMerge(
        "absolute left-0 top-0 flex h-full w-full justify-between pointer-events-none",
        matteOri === MatteOrientation.TOP_BOTTOM ? "flex-col" : null,
      )}
    >
      <Matte matteOri={matteOri} width={matteWidth} height={matteHeight} />
      <Matte matteOri={matteOri} width={matteWidth} height={matteHeight} />
    </div>
  );
};

const Matte = ({
  matteOri,
  width,
  height,
}: {
  matteOri: MatteOrientation;
  width?: number;
  height?: number;
}) => {
  if (matteOri === MatteOrientation.TOP_BOTTOM) {
    return (
      <div
        className="h-20 w-full bg-black/30 brightness-75"
        style={{ height: `${height}px` }}
      />
    );
  }
  return (
    <div
      className="h-full w-80 bg-black/30 brightness-75"
      style={{ width: `${width}px` }}
    />
  );
};
