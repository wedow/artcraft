import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useTransition } from "@react-spring/web";
import { v4 as uuidv4 } from "uuid";
import { useFile, useInferenceJobs, useLocalize, useMedia } from "hooks";
import { springs } from "resources";
import {
  UploadAudio,
  // UploadAudioIsOk,
  // UploadAudioRequest,
} from "@storyteller/components/src/api/upload/UploadAudio";
import {
  UploadImage,
  // UploadImageIsOk,
  // UploadImageRequest,
} from "@storyteller/components/src/api/upload/UploadImage";
import {
  EnqueueFaceAnimation,
  // EnqueueFaceAnimationIsSuccess,
  // EnqueueFaceAnimationRequest,
} from "@storyteller/components/src/api/face_animation/EnqueueFaceAnimation";
import FaceAnimatorSubViews from "./sub_views";
import FaceAnimatorTitle from "./FaceAnimatorTitle";
import InferenceJobsList from "components/layout/InferenceJobsList";
import { Container, Panel, VideoBasic } from "components/common";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import { Analytics } from "common/Analytics";
import "./FaceAnimator.scss";
import PremiumLock from "components/PremiumLock";
import { AITools } from "components/marketing";
import { useFeatureFlags } from "hooks/useFeatureFlags";
import Maintenance from "components/common/Maintenance";

export default function FaceAnimator() {
  const { isVideoToolsEnabled } = useFeatureFlags();

  const { mediaToken } = useParams<{ mediaToken: string }>();
  const { media: presetAudio } = useMedia({ mediaToken });
  const { t } = useLocalize("Lipsync");
  usePrefixedDocumentTitle("Lipsync");

  // the ready states are set by functions which run after the upload input animation is completed, which then illuminates the respective checkmark in a staggered way to draw attention to the workflow, and reduces concurrent animations

  const [imageReady, imageReadySet] = useState<boolean>(false);
  const [audioReady, audioReadySet] = useState<boolean>(false);
  const readyMedia = (m: number) => (t: boolean) =>
    [imageReadySet, audioReadySet][m](t);
  const audioProps = useFile({}); // contains upload inout state and controls, see docs
  const imageProps = useFile({}); // contains upload inout state and controls, see docs
  const [index, indexSet] = useState<number>(0); // index  = slideshow slide position

  //const [animationStyle,animationStyleSet] = useState(0);
  const [frameDimensions, frameDimensionsSet] = useState("twitter_square");
  const [removeWatermark, removeWatermarkSet] = useState(false);
  const [disableFaceEnhancement, disableFaceEnhancementSet] = useState(false);
  const [still, stillSet] = useState(false);

  const [preferPresetAudio, preferPresetAudioSet] = useState(!!mediaToken);

  const { enqueueInferenceJob } = useInferenceJobs();

  //const animationChange = ({ target }: any) => animationStyleSet(target.value);
  const frameDimensionsChange = ({ target }: any) =>
    frameDimensionsSet(target.value);
  const removeWatermarkChange = ({ target }: any) =>
    removeWatermarkSet(target.checked);
  const disableFaceEnhancementChange = ({ target }: any) =>
    disableFaceEnhancementSet(target.checked);
  const stillChange = ({ target }: any) => stillSet(target.checked);
  const clearInputs = () => {
    //animationStyleSet(0);
    stillSet(false);
    frameDimensionsSet("twitter_square");
    removeWatermarkSet(false);
    disableFaceEnhancementSet(false);
  };

  const makeRequest = (mode: number) => ({
    uuid_idempotency_token: uuidv4(),
    file: mode ? imageProps.file : audioProps.file,
    source: "file",
    type: mode ? "image" : "audio",
  });

  const upImageAndMerge = async (audio: any) => ({
    audio,
    image: await UploadImage(makeRequest(1)),
  });

  const MergeAndEnque = (res: any) =>
    upImageAndMerge(res)
      .then(responses => {
        if ("upload_token" in responses.image) {
          indexSet(3); // set face animator API working page

          // NB(bt,2023-12-08): We currently still have "media_files" and "media_uploads" as distinct backend record
          // types (and APIs for each). One of our ongoing tasks is to phase out media_uploads entirely and make
          // everything a media_file.
          //
          // Since the flow for this code is somewhat rigid, we're going to change the token type based on the token
          // structure. Ordinarily this should **NEVER** be done, but hopefully this migration state is short enough
          // that we won't need to worry about multiple token formats for long.
          //
          // Tokens starting with:
          //
          //  m_* => media file tokens
          //  mu_* => media upload tokens
          //
          const audioIsMediaFile =
            responses.audio.upload_token.startsWith("m_");
          const imageIsMediaFile =
            responses.image.upload_token.startsWith("m_");

          let request: any = {
            uuid_idempotency_token: uuidv4(),
            audio_source: undefined,
            image_source: undefined,
            //audio_source: {
            //  maybe_media_upload_token: responses.audio.upload_token,
            //},
            //image_source: {
            //  maybe_media_upload_token: responses.image.upload_token,
            //},
            make_still: still,
            disable_face_enhancement: disableFaceEnhancement,
            remove_watermark: removeWatermark,
            dimensions: frameDimensions,
          };

          if (audioIsMediaFile) {
            request.audio_source = {
              maybe_media_file_token: responses.audio.upload_token,
            };
          } else {
            request.audio_source = {
              maybe_media_upload_token: responses.audio.upload_token,
            };
          }

          if (imageIsMediaFile) {
            request.image_source = {
              maybe_media_file_token: responses.image.upload_token,
            };
          } else {
            request.image_source = {
              maybe_media_upload_token: responses.image.upload_token,
            };
          }

          return EnqueueFaceAnimation(request);
        }
      })
      .then(res => {
        if (res && res.inference_job_token) {
          enqueueInferenceJob(
            res.inference_job_token,
            FrontendInferenceJobType.FaceAnimation
          );
          indexSet(4); // set face animator API success page
        }
      })
      .catch(e => {
        // @ts-ignore
        window.dataLayer.push({
          event: "upload_failure",
          page: "/face-enqueue_failure",
          user_id: "$user_id",
        });
        return { success: false }; // we can do more user facing error handling
      });

  const submit = async () => {
    if (!presetAudio && !audioProps.file) return false;

    indexSet(1); // set audio working page

    if (presetAudio && preferPresetAudio) {
      MergeAndEnque({ upload_token: mediaToken }); // if there is a media token then we enque this like a "fake" audio/media response
    } else {
      UploadAudio(makeRequest(0)) // if there an audio file it uploads here
        .then(res => {
          if ("upload_token" in res) {
            indexSet(2); // set image working page
          }
          return MergeAndEnque(res); // start image upload, then combine both responses into an enqueue request
        });
    }
  };
  const page = index === 0 ? 0 : index === 4 ? 2 : 1;
  const headerProps = {
    audioProps,
    audioReady,
    clearInputs,
    imageProps,
    imageReady,
    indexSet,
    page,
    presetAudio,
    preferPresetAudio,
    submit,
    t,
  };

  const transitions = useTransition(index, {
    ...springs.soft,
    from: { opacity: 0, position: "absolute" },
    enter: { opacity: 1, position: "relative" },
    leave: { opacity: 0, position: "absolute" },
  });

  const failures = (fail = "") => {
    switch (fail) {
      case "face_not_detected":
        return "Face not detected, try another picture";
      default:
        return "Uknown failure";
    }
  };

  if (!isVideoToolsEnabled()) {
    return (
      <Maintenance
        title="Face Animator is currently in maintenance mode"
        description="We're working hard to bring you the best experience possible. Please check back soon!"
      />
    );
  }

  return (
    <>
      <div {...{ className: "face-animator-container container-panel pt-4" }}>
        <FaceAnimatorTitle {...headerProps} />
        <PremiumLock requiredPlan="any" large={true} showCtaButton={true}>
          <div {...{ className: "panel face-animator-main" }}>
            {transitions((style, i) => {
              const Page = FaceAnimatorSubViews[page];
              return Page ? (
                <Page
                  {...{
                    audioProps,
                    imageProps,
                    frameDimensions,
                    frameDimensionsChange,
                    disableFaceEnhancement,
                    disableFaceEnhancementChange,
                    enqueueInferenceJob,
                    preferPresetAudio,
                    preferPresetAudioSet,
                    presetAudio,
                    still,
                    stillChange,
                    index,
                    t,
                    toggle: { audio: readyMedia(1), image: readyMedia(0) },
                    style,
                    removeWatermark,
                    removeWatermarkChange,
                  }}
                />
              ) : null;
            })}
          </div>
        </PremiumLock>
        <InferenceJobsList
          {...{
            failures,
            onSelect: () => Analytics.voiceConversionClickDownload(),
            jobType: FrontendInferenceJobType.FaceAnimation,
          }}
        />
        <div className="face-animator-mobile-sample">
          <VideoBasic
            title="Face Animator Sample"
            src="/videos/face-animator-instruction-en.mp4"
          />
        </div>

        {/* <div className="py-5">
        <StorytellerStudioCTA title="Try Storyteller Studio" />
      </div> */}
      </div>

      <Container type="panel" className="pt-5 mt-5">
        <Panel clear={true}>
          <h2 className="fw-bold mb-3">Try other AI video tools</h2>
          <AITools />
        </Panel>
      </Container>
    </>
  );
}
