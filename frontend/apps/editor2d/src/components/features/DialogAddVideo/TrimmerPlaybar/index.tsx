import { Signal } from "@preact/signals-react";
import { TrimmerPlaybarCore } from "./TrimmerPlaybarCore";
import { TrimmingPlaybarLoading } from "./TrimmerPlaybarLoading";
import { TrimData } from "./utilities";
export type { TrimData };
export const TrimmerPlaybar = ({
  vidEl,
  trimDataSignal,
  className,
  onTrimChange,
}: {
  vidEl: HTMLVideoElement | undefined;
  className?: string;
  trimDataSignal: Signal<TrimData | undefined>;
  onTrimChange: (trimData: TrimData) => void;
}) => {
  if (!vidEl) {
    return <TrimmingPlaybarLoading />;
  }
  return (
    <TrimmerPlaybarCore
      vidEl={vidEl}
      className={className}
      trimData={trimDataSignal.value}
      onTrimChange={onTrimChange}
    />
  );
};
