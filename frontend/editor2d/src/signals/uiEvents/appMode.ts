import { signal, effect } from "@preact/signals-core";

// this is to control the app mode - BFlat

// Define the app mode types
export type AppModeType = "realtime" | "edit" | "generate" | "gallery";

// Create a signal for the current app mode
export const appMode = signal<AppModeType>("realtime");

// Create a function to change the app mode
export const changeAppMode = (mode: AppModeType) => {
  appMode.value = mode;
};

// Store callbacks for mode changes
const callbacks: ((mode: AppModeType) => void)[] = [];

// Set up an effect to notify callbacks when the mode changes
effect(() => {
  const currentMode = appMode.value;
  callbacks.forEach((callback) => callback(currentMode));
});

// Export an event handler for components to use
export const appModeEvents = {
  onChange: (callback: (mode: AppModeType) => void) => {
    callbacks.push(callback);

    // Return a function to unsubscribe
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  },
};
