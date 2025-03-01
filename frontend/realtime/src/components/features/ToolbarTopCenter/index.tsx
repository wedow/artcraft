import { SignaledLoadingIndicator } from "~/KonvaRootComponent/SignaledLoadingIndicator";
import { SignaledModelButtons } from "~/KonvaRootComponent/SignaledModelButtons";

export const ToolbarTopCenter = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Model selection buttons (only shown in dev mode for now) */}
      {import.meta.env.DEV && <SignaledModelButtons />}

      {/* Loading models indicator (only shown in dev mode for now) */}
      {import.meta.env.DEV && <SignaledLoadingIndicator />}
    </div>
  );
};
