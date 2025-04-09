import React from "react";
import { Link } from "react-router-dom";
import { Button, Panel } from "components/common";
import "./AIFaceMirrorCTA.scss";
import { useFeatureFlags } from "hooks/useFeatureFlags";

interface Props {
  className?: string;
}

export default function AIFaceMirrorCTA({ className }: Props) {
  const { isVideoToolsEnabled } = useFeatureFlags();

  if (!isVideoToolsEnabled()) {
    return null;
  }

  return (
    <Panel className="cta-ai-face-mirror">
      <Link
        {...{ className: "cta-ai-face-mirror-body", to: "/ai-live-portrait" }}
      >
        <video
          autoPlay={true}
          controls={false}
          muted={true}
          loop={true}
          playsInline={true}
        >
          <source src="/videos/motion_mirror_bg_04.mp4" type="video/mp4" />
        </video>
        <div {...{ className: "cta-ai-face-mirror-tint" }}></div>
        <div {...{ className: "cta-ai-face-mirror-overlay" }}>
          <div {...{ className: "cta-ai-face-mirror-copy" }}>
            <h1 className="fw-bold">Live Portrait</h1>
            <p>Reflect motion from one portrait to another</p>
          </div>

          <Button
            {...{
              className: "cta-ai-face-mirror-button",
              label: "Create now",
              // to: "/ai-face-mirror",
            }}
          />
        </div>
      </Link>
    </Panel>
  );
}
