import { useRef } from "react";
import { useSignalEffect } from "@preact/signals-react/runtime";
import { Signal } from "@preact/signals-react";

export const useSignalRenderCounter = <T>(
  componentName: string,
  signal: Signal<T>,
) => {
  const renderCount = useRef(0);
  const signalValue = useRef(signal.value);
  const signalUpdateCount = useRef(0);

  useSignalEffect(() => {
    signalValue.current = signal.value;
    signalUpdateCount.current++;
    return;
  });

  renderCount.current++;
  const adjustedRenderCount =
    renderCount.current >= 3 ? (renderCount.current - 3) / 2 : 1;
  if (import.meta.env.DEV) {
    if (signalUpdateCount.current === 0 && renderCount.current <= 3) {
      return;
    }
    if (adjustedRenderCount - signalUpdateCount.current <= 0.5) {
      return;
    } else {
      console.warn(
        `${componentName} rerendered ${adjustedRenderCount} times, but signal updated ${signalUpdateCount.current} times`,
      );
    }
  }
  return renderCount.current;
};
