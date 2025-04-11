import { useQueueHandler } from "~/pages/PageEnigma/hooks/useQueueHandler";
import { useCallback, useEffect, useState } from "react";
import { QueueSubscribeType } from "~/pages/PageEnigma/Queue/Queue";
import Queue, { QueueNames } from "~/pages/PageEnigma/Queue";
import { parseQueueData } from "~/stories/TimelineStories/parseQueueData";

export const QueueIn = ({ refresh }: { refresh: number }) => {
  useQueueHandler();
  const [queueAction, setQueueAction] = useState("");
  const [queueData, setQueueData] = useState<any>();

  useEffect(() => {
    setQueueAction("");
    setQueueData(null);
  }, [refresh]);

  const handleFromEngineActions = useCallback(
    ({ action, data }: QueueSubscribeType) => {
      setQueueAction(action);
      setQueueData(data);
    },
    [],
  );

  const handleToTimelineActions = useCallback(
    ({ action, data }: QueueSubscribeType) => {
      setQueueAction(action);
      setQueueData(data);
    },
    [],
  );

  useEffect(() => {
    Queue.subscribe(QueueNames.FROM_ENGINE, "fromE", handleFromEngineActions);
    Queue.subscribe(QueueNames.TO_TIMELINE, "toTL", handleToTimelineActions);
  }, [handleFromEngineActions, handleToTimelineActions]);
  return (
    <div className="text-black">
      <div>
        <strong>Messages from Engine</strong>
      </div>
      <div>Action: {queueAction || "None"}</div>
      <div className="h-[210px] w-[200px] overflow-auto">
        Data: {parseQueueData(queueData, 1)}
      </div>
    </div>
  );
};
