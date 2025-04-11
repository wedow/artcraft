import React from "react";
import { Link } from "react-router-dom";
import { Analytics } from "common/Analytics";
import { WebUrl } from "common/WebUrl";
import { useInferenceJobs } from "hooks";

interface Props {
  hasPaidFeatures?: boolean;
}

export default function JobQueueTicker({ hasPaidFeatures }: Props) {
  const { queueStats } = useInferenceJobs();
  const { inference, legacy_tts } = queueStats;


  // const abc = useQueuePoll();

  return <div {...{ className: "fy-job-queue-ticker" }}>
    <header>
      <h6>
        Jobs queue
      </h6>
      { !hasPaidFeatures && <div {...{ className: "cta-memembership" }}>
        <Link {...{
          className: "cta-membership-gradient",
          onClick: () => Analytics.ttsTooSlowUpgradePremium(),
          to: WebUrl.pricingPageWithReferer("nowait")
        }}>
          <svg {...{ className: "job-cta-clock" }}>
            <mask {...{ id: "job-list-clockhand" }}>
              <circle {...{ className: "mask-circle", cx: 21, cy: 21, r: 21 }}/>
              <path d="M21.9,5.96c.22,4.4.6,12.44.6,15.04,0,.86-.5,1.46-1.5,1.46s-1.5-.52-1.5-1.46c0-3.14.37-10.75.59-15,.05-.95.43-1.28.87-1.28s.89.32.94,1.25Z" fill="black" />
            </mask>
            <circle {...{ className: "clock-circle", cx: 21, cy: 21, r: 21, mask: "url(#job-list-clockhand)" }}/>
          </svg>
          <div {...{ className: "job-cta-message" }}>
            Don't want to wait?<br />
            Skip to the front of the queue with a <span>FakeYou membership</span>
          </div>
        </Link>
      </div> }
    </header>
    <div {...{ className: "fy-job-queue-grid" }}>
      <div>
        <div>Text To Speech</div>
        { legacy_tts.pending_job_count + inference.by_queue.pending_tacotron2_jobs }
      </div>
      <div>
        <div>RVC</div>
        { inference.by_queue.pending_rvc_jobs }
      </div>
      <div>
        <div>SVC</div>
        { inference.by_queue.pending_svc_jobs }
      </div>
      <div>
        <div>Image Geneneration</div>
        { inference.by_queue.pending_stable_diffusion }
      </div>
      <div>
        <div>Face Animation</div>
        { inference.by_queue.pending_face_animation_jobs }
      </div>
      <div>
        <div>Voice Designer</div>
        { inference.by_queue.pending_voice_designer }
      </div>
    </div>
  </div>;
};