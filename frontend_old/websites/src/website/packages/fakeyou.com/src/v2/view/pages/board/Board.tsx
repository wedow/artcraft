import React from "react";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Button, Container, Panel } from "components/common";
import { faArrowRight, faSparkles } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFeatureFlags } from "hooks/useFeatureFlags";

export default function Board() {
  usePrefixedDocumentTitle("Storyteller Board");

  const { isVideoToolsEnabled } = useFeatureFlags();

  if (!isVideoToolsEnabled()) {
    return null;
  }

  return (
    <div>
      <Container
        type="panel"
        className="d-flex align-items-center justify-content-center mt-5"
      >
        <Panel padding={true} className="text-center p-4 p-lg-5">
          <h1 className="fw-bold mb-2 display-5 d-flex gap-3 align-items-center justify-content-center">
            <FontAwesomeIcon icon={faSparkles} className="fs-1" />
            Storyteller Board
          </h1>
          <p className="lead mb-5">
            Create stunning visual stories on our intelligent canvas.
            <br className="d-none d-lg-block" />
            Compose scenes, remove backgrounds, apply AI styles and render
            videos in minutes.
          </p>

          <video
            className="w-100 h-100 rounded"
            style={{ maxWidth: "820px" }}
            autoPlay
            muted
            loop
            playsInline
          >
            <source
              src="/videos/board/storyteller-board-demo.mp4"
              type="video/mp4"
            />
          </video>

          <div className="d-flex justify-content-center">
            <Button
              label="Try Storyteller Board Now"
              className="mt-4 py-3"
              icon={faArrowRight}
              iconFlip={true}
              href="https://board.storyteller.ai/"
              target="_blank"
            />
          </div>
          <p className="opacity-75 mt-3">
            (You can log in with your FakeYou account)
          </p>
        </Panel>
      </Container>
    </div>
  );
}
