import { useRef } from "react";

export const useRenderCounter = (componentName: string) => {
  const renderCount = useRef(0);
  renderCount.current++;
  if (renderCount.current === 1) {
    if (import.meta.env.DEV) {
      console.log(`${componentName} rerendered ${renderCount.current} times`);
    }
  } else {
    console.warn(`${componentName} rerendered ${renderCount.current} times`);
  }
  return renderCount.current;
};
