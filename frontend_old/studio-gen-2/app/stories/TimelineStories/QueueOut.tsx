import { useQueueHandler } from "~/pages/PageEnigma/hooks/useQueueHandler";
import { useCallback, useEffect, useState } from "react";
import { QueueSubscribeType } from "~/pages/PageEnigma/Queue/Queue";
import Queue, { QueueNames } from "~/pages/PageEnigma/Queue";
import { parseQueueData } from "~/stories/TimelineStories/parseQueueData";

export const QueueOut = ({ refresh }: { refresh: number }) => {
  useQueueHandler();
  const [queueAction, setQueueAction] = useState("");
  const [queueData, setQueueData] = useState<any>();

  useEffect(() => {
    setQueueAction("");
    setQueueData(null);
  }, [refresh]);

  const handleToEngineActions = useCallback(
    ({ action, data }: QueueSubscribeType) => {
      setQueueAction(action);
      setQueueData(data);
    },
    [],
  );

  useEffect(() => {
    Queue.subscribe(QueueNames.TO_ENGINE, "toE", handleToEngineActions);
  }, [handleToEngineActions]);
  return (
    <div className="text-black">
      <div>
        <strong>Messages to Engine</strong>
      </div>
      <div>Action: {queueAction || "None"}</div>
      <div className="h-[210px] w-[200px] overflow-auto">
        Data: {parseQueueData(queueData, 1)}
      </div>
    </div>
  );
};
