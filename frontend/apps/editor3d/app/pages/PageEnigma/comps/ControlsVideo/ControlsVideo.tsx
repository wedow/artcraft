import { useContext, useState } from "react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  faBackwardStep,
  faForwardStep,
  faCirclePause,
  faCirclePlay,
  faPlay,
  faRepeat,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonIcon, Tooltip } from "~/components";
import { EngineContext } from "~/pages/PageEnigma/contexts/EngineContext";
import {
  currentTime,
  filmLength,
  secondaryScrubber,
} from "~/pages/PageEnigma/signals";
import Queue from "~/pages/PageEnigma/Queue/Queue";
import { QueueNames } from "~/pages/PageEnigma/Queue/QueueNames";
import { toEngineActions } from "~/pages/PageEnigma/Queue/toEngineActions";
import { editorState } from "~/pages/PageEnigma/signals/engine";
import { EditorStates } from "~/pages/PageEnigma/enums";
import { twMerge } from "tailwind-merge";
import { usePosthogFeatureFlag } from "~/hooks/usePosthogFeatureFlag";
import { FeatureFlags } from "~/enums";

export const ControlsVideo = () => {
  useSignals();
  const editorEngine = useContext(EngineContext);
  const [refresh, setRefresh] = useState(0);
  const showStylePage = usePosthogFeatureFlag(FeatureFlags.SHOW_STYLE_PAGE);

  function formatTime(millis: number) {
    const date = new Date(millis);
    const secs = String(date.getUTCSeconds()).padStart(2, "0");
    const ms = String(date.getUTCMilliseconds()).padStart(3, "0");
    return `00:${secs}:${ms}`;
  }

  const isPlaying =
    editorEngine !== null ? editorEngine.timeline.is_playing : false;
  const isRepeating =
    editorEngine !== null ? editorEngine.timeline.is_repeating : false;

  const handleToStart = () => {
    currentTime.value = 0;
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_TIME,
      data: { currentTime: currentTime.value },
    });
  };

  const handleToEnd = () => {
    currentTime.value = filmLength.value * 1000;
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_TIME,
      data: { currentTime: currentTime.value },
    });
  };

  const handleBackwardStep = () => {
    currentTime.value = Math.max(currentTime.value - 1, 0);
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_TIME,
      data: { currentTime: currentTime.value },
    });
  };
  const handleRepeat = () => {
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.TOGGLE_REPEATING,
      data: null,
    });
    setRefresh((refresh + 1) % 10);
  };
  const handlePlayback = () => {
    editorEngine?.togglePlayback();
  };
  const handleForwardStep = () => {
    currentTime.value = Math.min(currentTime.value + 1, filmLength.value * 1000);
    Queue.publish({
      queueName: QueueNames.TO_ENGINE,
      action: toEngineActions.UPDATE_TIME,
      data: { currentTime: currentTime.value },
    });
  };

  if (editorState.value === EditorStates.PREVIEW) {
    return null;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-4 rounded-t-lg bg-ui-controls p-1.5 text-white shadow-md">
        <div className="flex items-center gap-1">
          <div className="flex gap-0">
            <ButtonIcon icon={faBackwardStep} onClick={handleToStart} />
            <ButtonIcon
              icon={faPlay}
              onClick={handleBackwardStep}
              className="rotate-180 text-sm"
            />
          </div>

          <ButtonIcon
            icon={isPlaying ? faCirclePause : faCirclePlay}
            onClick={handlePlayback}
            className="p-0 text-2xl"
          />

          <div className="flex gap-0">
            <ButtonIcon
              icon={faPlay}
              onClick={handleForwardStep}
              className="text-sm"
            />
            <ButtonIcon icon={faForwardStep} onClick={handleToEnd} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="mr-2 flex items-center gap-1.5 text-sm font-medium">
            <span className="w-[54px]">
              {formatTime(secondaryScrubber.value)}
            </span>
            <span className="opacity-50">/</span>
            <span className="w-[54px] opacity-50">
              {formatTime(filmLength.value * 1000)}
            </span>
          </div>
          {showStylePage && (
            <>
              <div className="h-[18px] w-0.5 rounded-full bg-white/20" />
              <Tooltip content="Loop" position={"top"}>
                <ButtonIcon
                  icon={faRepeat}
                  onClick={handleRepeat}
                  className={twMerge(
                    "h-7 w-7 p-0 text-sm",
                    isRepeating
                      ? "border border-brand-primary"
                      : "border border-transparent",
                  )}
                />
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
