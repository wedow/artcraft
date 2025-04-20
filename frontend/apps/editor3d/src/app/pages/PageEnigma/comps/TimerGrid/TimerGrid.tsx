import {
  filmLength,
  frameTrackButtonWidthPx,
  fullHeight,
  scale,
  timelineScrollX,
} from "~/pages/PageEnigma/signals";
import { Fragment } from "react";
import { useSignals } from "@preact/signals-react/runtime";

export const TimerGrid = () => {
  useSignals();
  const sectionWidth = 1000 * 4 * scale.value;
  const scrollX = timelineScrollX.value;

  return (
    <div
      className={[
        "prevent-select mt-2",
        "relative flex h-5 overflow-hidden",
        "border-t border-t-ui-panel-border",
        "text-xs text-white opacity-75",
      ].join(" ")}

      style={{
        marginLeft: `${204 + frameTrackButtonWidthPx}px`
      }}
    >
      <div className="absolute" style={{ left: scrollX * -1 }}>
        {Array(filmLength.value)
          .fill(0)
          .map((_, index) => (
            <Fragment key={index}>
              <div
                className="absolute ps-0.5 pt-1.5 text-[11px]"
                style={{ left: index * sectionWidth + 4 }}
              >
                00:{index < 10 ? "0" + index.toString() : index.toString()}
              </div>
              <div
                className="absolute mt-0.5 block bg-ui-divider"
                style={{
                  width: 1,
                  left: index * sectionWidth,
                  height: fullHeight.value,
                }}
              />
              {Array(9)
                .fill(0)
                .map((_, ind) => (
                  <div
                    key={ind}
                    className="absolute mt-0.5 block h-1 bg-ui-divider"
                    style={{
                      width: 1,
                      top: 0,
                      left:
                        index * sectionWidth + (sectionWidth / 10) * (ind + 1),
                    }}
                  />
                ))}
            </Fragment>
          ))}
        <div
          className="absolute ps-0.5 pt-1.5 text-[11px]"
          style={{ left: filmLength.value * sectionWidth + 4 }}
        >
          00:
          {filmLength.value < 10
            ? "0" + filmLength.value.toString()
            : filmLength.value.toString()}
        </div>
        <div
          className="absolute block h-full bg-ui-divider"
          style={{
            width: 1,
            left: filmLength.value * sectionWidth,
            height: fullHeight.value,
          }}
        />
      </div>
    </div >
  );
};
