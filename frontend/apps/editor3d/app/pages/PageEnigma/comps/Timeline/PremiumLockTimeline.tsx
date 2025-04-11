import { Link } from "@remix-run/react";
import { fullWidth, timelineHeight } from "../../signals";

interface PremiumLockTimelineProps {
  locked: boolean;
}

export default function PremiumLockTimeline({
  locked,
}: PremiumLockTimelineProps) {
  return (
    <>
      {locked ? (
        <div className="sticky left-0 top-1/2 z-20 h-full w-full -translate-y-1/2 transform">
          <div
            style={{
              height: timelineHeight.value,
              width: fullWidth.value - 704,
            }}
            className="absolute top-1/2 ml-[720px] -translate-y-1/2 transform border-l border-[#43435C] bg-ui-panel/70 backdrop-blur-sm"
          >
            <div className="flex h-full w-full flex-col justify-center pl-12">
              <div className="flex w-[400px] flex-col gap-1 rounded-lg border border-white/40 bg-ui-controls p-4 text-center shadow-lg">
                <h6 className="text-md font-medium">
                  Your timeline is currently limited to 3 seconds.
                </h6>
                <p className="text-sm font-normal">
                  Please{" "}
                  <Link
                    to="/pricing"
                    className="font-medium text-brand-primary brightness-125"
                  >
                    upgrade your account
                  </Link>{" "}
                  to increase the movie render length up to 7 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
