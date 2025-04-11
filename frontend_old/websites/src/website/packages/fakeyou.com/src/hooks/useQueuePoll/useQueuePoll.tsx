import {
  // useEffect,
  useState,
} from "react";
import {
  BaseQueueObject,
  GetQueues,
  GetQueuesResponse,
  QueuePollRefreshDefault,
} from "@storyteller/components/src/api/stats/queues/GetQueues";
import { useInterval } from "hooks";

export default function useQueuePoll() {
  const [queueStats, setQueueStats] =
    useState<GetQueuesResponse>(BaseQueueObject());
  // const [initialized, initializedSet] = useState(false);

  const interval = Math.max(
    QueuePollRefreshDefault,
    queueStats.refresh_interval_millis
  );

  const onTick = ({
    eventProps: { queueStats: currentQueue },
  }: {
    eventProps: { queueStats: GetQueuesResponse };
  }) => {
    GetQueues("", {}).then((res: GetQueuesResponse) => {
      if (res.cache_time) {
        let cache_time = new Date(res.cache_time);

        if (cache_time.getTime() > currentQueue.cache_time.getTime()) {
          setQueueStats({ ...res, cache_time });
        }
      }
    });
  };

  // useEffect(() => {
  //   if (!initialized) {
  //     initializedSet(true);
  //     onTick({ eventProps: { queueStats } });
  //   }
  // }, [initialized, queueStats]);

  useInterval({
    eventProps: { queueStats },
    interval,
    onTick,
    locked: true,
  });

  return queueStats;
}
