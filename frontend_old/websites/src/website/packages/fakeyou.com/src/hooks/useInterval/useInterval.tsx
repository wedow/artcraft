import { useEffect, useRef } from "react";

export interface IntervalEvent {
  end: number;
  eventProps: any;
  index: number;
  locked: boolean;
  restart: () => void;
  start: number;
}

export interface IntervalRef {
  index: number;
  initialized: boolean;
  kill: boolean;
  ticker: number | null;
}

export interface UseIntervalProps {
  debug?: string;
  end?: number;
  eventProps?: any;
  interval?: number;
  locked?: boolean;
  onTick?: (tickerState: IntervalEvent) => any;
  start?: number;
}

export default function useInterval({
  debug,
  end = 3,
  eventProps,
  interval,
  locked = false,
  onTick = () => {},
  start = 0,
}: UseIntervalProps) {
  // state is stored via ref to be persistant against rerenders
  const config = useRef<IntervalRef>({
    index: start || 0,
    kill: false,
    initialized: false,
    ticker: null,
  });

  useEffect(() => {
    const ticker = config.current.ticker;
    const kill = config.current.kill;
    const restart = () => (config.current.kill = true);
    const intervalEvent = { end, eventProps, locked, restart, start };

    if (debug) {
      console.log(`🔄 useInterval useEffect at ${debug}:`, {
        eventProps,
        ticker,
        locked,
      });
    }

    if (!config.current.initialized) {
      if (debug) console.log(`🌱 useInterval at ${debug} initial tick`);
      config.current.initialized = true;
      onTick({ ...intervalEvent, index: 1 });
    }

    if (!ticker && !locked) {
      let newTicker = (index: number) =>
        setInterval(() => {
          config.current.index = index < end ? index + 1 : start;

          if (debug)
            console.log(`⏱️ useInterval tick at ${debug}: `, intervalEvent);

          if (!locked) {
            onTick({ ...intervalEvent, index });
          }
        }, interval || 500);

      config.current.ticker = Number(newTicker(config.current.index)) || 9999;
    }

    if (ticker && (kill || locked)) {
      if (debug) {
        console.log(
          `🔒 useInterval at ${debug} ${
            kill ? "restarted" : "locked"
          }, clearing interval #`,
          ticker
        );
      }

      if (kill) {
        config.current.kill = false;
      }

      config.current.ticker = null;

      return () => clearInterval(ticker);
    }
  }, [debug, end, eventProps, interval, locked, onTick, start]);

  return config.current;
}
