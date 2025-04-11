import {
  faFlask,
  faScrewdriverWrench,
  faSparkles,
} from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Container, Panel } from "components/common";
import { useLocalize } from "hooks";
import React from "react";
import { AIToolsRow } from "components/marketing";
import "./CreatorTools.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isVideoToolsEnabled } from "config/featureFlags";

export default function CreatorToolsPage() {
  const { t } = useLocalize("LandingPage");

  usePrefixedDocumentTitle("Creator Tools");

  type Item = {
    to?: string;
    externalLink?: string;
    title: string;
    text: string;
    imgSrc?: string;
    imgAlt: string;
    videoSrc?: string;
    videoPosterSrc?: string;
    badgeContent?: {
      type: string;
      icon: any;
      label: string;
    };
    videoPosition?: "top" | "center";
  };

  const videoProducts: Item[] = [
    ...(isVideoToolsEnabled()
      ? [
          {
            to: "/style-video",
            title: t("productVideoStyleTransferTitle"),
            text: t("productVideoStyleTransferText"),
            videoSrc: "/videos/ai-tools/vst_video.mp4",
            videoPosterSrc: "/images/ai-tools/vst",
            imgAlt: "Video Style Transfer",
            badgeContent: {
              type: "new",
              icon: faSparkles,
              label: "NEW",
            },
          },

          {
            to: "/ai-live-portrait",
            title: t("productLivePortraitTitle"),
            text: t("productLivePortraitText"),
            videoSrc: "/videos/ai-tools/lp_video.mp4",
            videoPosterSrc: "/images/ai-tools/live_portrait",
            imgAlt: "Live Portrait",
            badgeContent: {
              type: "new",
              icon: faSparkles,
              label: "NEW",
            },
          },
          {
            to: "/face-animator",
            title: t("productLipsyncTitle"),
            text: t("productLipsyncText"),
            videoSrc: "/videos/ai-tools/ls_video.mp4",
            videoPosterSrc: "/images/ai-tools/lipsync",
            imgAlt: "Lipsync",
          },
          {
            to: "/webcam-acting",
            title: "Webcam Acting",
            text: "Act as your character through your camera",
            videoSrc: "/videos/ai-tools/ca_video.mp4",
            videoPosterSrc: "/images/ai-tools/webcam_acting",
            imgAlt: "Video Compositor",
          },
        ]
      : []),
  ];

  const voiceProducts = [
    {
      to: "/tts",
      title: t("productTtsTitle"),
      text: t("productTtsText"),
      imgSrc: "/images/landing/select-tts.webp",
      imgAlt: "Text to Speech",
    },
    {
      to: "/voice-conversion",
      title: t("productVcTitle"),
      text: t("productVcText"),
      imgSrc: "/images/landing/select-v2v.webp",
      imgAlt: "Voice Conversion",
    },

    {
      to: "/voice-designer",
      title: t("productVdTitle"),
      text: t("productVdText"),
      imgSrc: "/images/landing/select-vd.webp",
      imgAlt: "Voice Cloning",
      badgeContent: {
        type: "beta",
        icon: faFlask,
        label: "BETA",
      },
    },
    {
      to: "/f5-tts",
      title: "F5-TTS Voice Cloning",
      text: "Zero-shot voice cloning",
      imgSrc: "/images/landing/select-f5-tts.webp",
      imgAlt: "Voice Cloning",
    },
    {
      to: "/seed-vc",
      title: "Seed-VC Voice Conversion",
      text: "Zero-shot voice conversion",
      imgSrc: "/images/landing/select-seed-vc.webp",
      imgAlt: "Zero-shot Voice Conversion",
    },
  ];

  return (
    <Container type="panel">
      <Panel clear={true} className="mt-5">
        <div className="mb-4">
          <h1 className="fw-bold mb-1 d-flex align-items-center">
            <FontAwesomeIcon icon={faScrewdriverWrench} className="me-3 fs-2" />
            Creator Tools
          </h1>
          <h5 className="opacity-75">
            {isVideoToolsEnabled()
              ? "AI-powered tools for video and voice creation."
              : "AI-powered tools for voice creation."}
          </h5>
        </div>

        <div className="d-flex flex-column gap-5">
          <div>
            {" "}
            {isVideoToolsEnabled() ? (
              <h2 className="fw-bold mb-3 mt-4">Video</h2>
            ) : null}
            <AIToolsRow items={videoProducts} />
          </div>

          <div>
            {isVideoToolsEnabled() ? (
              <h2 className="fw-bold mb-3 mt-4">Voice & Audio</h2>
            ) : null}
            <AIToolsRow items={voiceProducts} />
          </div>
        </div>
      </Panel>
    </Container>
  );
}
