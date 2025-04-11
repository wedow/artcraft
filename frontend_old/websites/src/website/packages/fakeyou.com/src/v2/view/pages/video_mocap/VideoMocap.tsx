import React, { useReducer, useEffect } from "react";
import { Redirect, useLocation } from "react-router-dom";

import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";

import { Button, Container, Panel, Tabs } from "components/common";
import { useInferenceJobs, useLocalize, useSession } from "hooks";

import TabContentUpload from "./components/tabContentUpload";
import TabContentLibrary from "./components/tabContentLibrary";
import PageVideoMocapProgress from "./components/pageVideoMocapProgress";
import VideoMocapJobList from "./components/videoMocapJobList";
import { states, reducer } from "./videoMocapReducer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faPersonCircleCheck,
  faPersonRays,
} from "@fortawesome/pro-solid-svg-icons";
import PageHeaderWithImage from "components/layout/PageHeaderWithImage";
import { StudioNotAvailable } from "v2/view/_common/StudioNotAvailable";

export default function VideoMotionCapture() {
  const { sessionWrapper } = useSession();
  const { t } = useLocalize("VideoMotionCapture");
  const { NO_FILE, FILE_UPLOADING, MOCAPNET_ENQUEUED } = states;
  const [pageState, dispatchPageState] = useReducer(reducer, {
    status: NO_FILE,
  });

  const { enqueueInferenceJob, inferenceJobsByCategory } = useInferenceJobs();
  const inferenceJobs = inferenceJobsByCategory.get(
    FrontendInferenceJobType.VideoMotionCapture
  );
  const hasMotionCaptureJobs = inferenceJobs && inferenceJobs.length > 0;

  useEffect(() => {
    if (
      pageState.status === states.MOCAPNET_ENQUEUED &&
      pageState.inferenceJobToken
    ) {
      enqueueInferenceJob(
        pageState.inferenceJobToken,
        FrontendInferenceJobType.VideoMotionCapture
      );
      dispatchPageState({
        type: "enqueueMocapNetSuccess",
        payload: { inferenceJobToken: undefined },
      });
    }
  }, [pageState, enqueueInferenceJob]);
  const { pathname } = useLocation();

  if (!sessionWrapper.canAccessStudio()) {
    return <StudioNotAvailable />;
  }

  if (pathname === `/video-mocap` || pathname === `/video-mocap/`) {
    return <Redirect to={`/video-mocap/upload`} />;
  }

  const tabs = [
    {
      label: t("tabTitle.upload"),
      content: <TabContentUpload {...{ t, pageState, dispatchPageState }} />,
      to: "/video-mocap/upload",
      padding: true,
    },
    {
      label: t("tabTitle.library"),
      content: <TabContentLibrary {...{ t, pageState, dispatchPageState }} />,
      to: "/video-mocap/select-media",
      padding: true,
    },
  ];

  return (
    <Container type="panel" className="mb-5">
      <PageHeaderWithImage
        title={t("headings.title")}
        subText={t("headings.subtitle")}
        headerImage="/mascot/video-mocap.webp"
        yOffset="62%"
        titleIcon={faPersonRays}
      />

      {hasMotionCaptureJobs && (
        <div className="mb-4">
          <VideoMocapJobList />
        </div>
      )}

      <Panel>
        <div className="row g-0">
          {pageState.status < FILE_UPLOADING && (
            <>
              <div className="col-12 col-md-6">
                <Tabs tabs={tabs} />
              </div>
              <div className="col-12 col-md-6 p-5 mt-3">
                <p>
                  Upload or select a video from the library, our AI will analyze
                  and turn it into a 3D model (aka a BVH file){" "}
                </p>
              </div>
            </>
          )}
          {pageState.status >= FILE_UPLOADING &&
            pageState.status < MOCAPNET_ENQUEUED && (
              <PageVideoMocapProgress
                {...{ t, pageState, dispatchPageState }}
              />
            )}
          {pageState.status === MOCAPNET_ENQUEUED && (
            <Panel padding={true}>
              <div className="d-flex flex-column gap-3 text-center align-items-center">
                <FontAwesomeIcon
                  icon={faPersonCircleCheck}
                  className="display-5 mb-2"
                />
                <h2 className="fw-semibold">
                  {t("tab.message.mocapNetRequestSucceed")}
                </h2>
                <div>
                  <Button
                    icon={faArrowRotateLeft}
                    iconFlip={true}
                    label="Generate Another"
                    onClick={() => {
                      dispatchPageState({ type: "restart" });
                    }} //back to first state
                    variant="primary"
                  />
                </div>
              </div>
            </Panel>
          )}
        </div>
      </Panel>
    </Container>
  );
}
