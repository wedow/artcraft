import {
  faImage,
  faMessageDots,
  faWaveform,
  faWaveformLines,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Panel } from "components/common";
import { AITools } from "components/marketing";
import { useSession } from "hooks";
import { useFeatureFlags } from "hooks/useFeatureFlags";
import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { sessionWrapper } = useSession();
  const isLoggedIn = sessionWrapper.isLoggedIn();
  const { isVideoToolsEnabled } = useFeatureFlags();

  let uploadModelSection = <></>;

  if (isLoggedIn) {
    uploadModelSection = (
      <>
        <h2 className="fw-bold mb-4 mt-5 pt-4">Upload Weights</h2>
        <div className="panel p-4 rounded">
          <div className="row gy-3 zi-2">
            <div className="col-12 col-lg-4">
              <Link to="/upload/tts" className="btn btn-secondary">
                <FontAwesomeIcon icon={faMessageDots} className="me-2" />
                Upload TTS Model
              </Link>
            </div>
            <div className="col-12 col-lg-4">
              <Link to="/upload/voice_conversion" className="btn btn-secondary">
                <FontAwesomeIcon icon={faWaveformLines} className="me-2" />
                Upload V2V Model
              </Link>
            </div>
            <div className="col-12 col-lg-4">
              <Link to="/upload/vocoder" className="btn btn-secondary">
                <FontAwesomeIcon icon={faWaveform} className="me-2" />
                Upload Vocoder
              </Link>
            </div>
            <div className="col-12 col-lg-4">
              <Link to="/upload/sd" className="btn btn-secondary">
                <FontAwesomeIcon icon={faImage} className="me-2" />
                Upload Stable Diffusion Weight
              </Link>
            </div>
            <div className="col-12 col-lg-4">
              <Link to="/upload/lora" className="btn btn-secondary">
                <FontAwesomeIcon icon={faImage} className="me-2" />
                Upload LoRA weight
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <Panel
      {...{
        className: !isVideoToolsEnabled ? "" : "pt-5 pb-5",
      }}
      clear={true}
    >
      <AITools />

      {uploadModelSection}
    </Panel>
  );
}
