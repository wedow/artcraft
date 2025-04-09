import React from "react";
import { animated } from "@react-spring/web";
import {
  TempAudioPlayer,
  AudioBlobPreview,
  AudioInput,
  VideoBasic,
  Checkbox,
  ImageInput,
  SegmentButtons,
} from "components/common";
import { FaceAnimatorSlide } from "../FaceAnimatorTypes";

export default function FaceAnimatorInput({
  audioProps,
  imageProps,
  frameDimensions,
  frameDimensionsChange,
  disableFaceEnhancement,
  disableFaceEnhancementChange,
  preferPresetAudio,
  preferPresetAudioSet,
  presetAudio,
  still,
  stillChange,
  toggle,
  style,
  t,
  removeWatermark,
  removeWatermarkChange,
}: FaceAnimatorSlide) {
  return (
    <animated.div {...{ className: "lipsync-editor row", style }}>
      <div {...{ className: "media-input-column col-lg-6 ga-image-input" }}>
        <h5>{t("headings.image")}</h5>
        <ImageInput
          {...{
            ...imageProps,
            onRest: () => toggle.image(imageProps.file ? true : false),
          }}
        />
      </div>
      <div
        {...{
          className:
            "media-input-column audio-input-column col-lg-6 ga-audio-input",
        }}
      >
        <h5>{t("headings.audio")}</h5>
        {presetAudio && preferPresetAudio ? (
          <TempAudioPlayer
            {...{
              actions: [
                {
                  label: "Upload file instead",
                  variant: "secondary",
                  onClick: () => {
                    preferPresetAudioSet(false);
                  },
                },
              ],
              mediaFile: presetAudio,
            }}
          />
        ) : (
          <AudioInput
            {...{
              ...audioProps,
              onRest: (p: any, c: any, item: any, l: any) =>
                toggle.audio(!!audioProps.file),
              // hideActions: true,
            }}
          >
            <AudioBlobPreview
              {...{
                ...audioProps,
                onRest: (p: any, c: any, item: any, l: any) =>
                  toggle.audio(!!audioProps.file),
                hideActions: true,
              }}
            />
          </AudioInput>
        )}
        <VideoBasic
          className="face-animator-wide-sample"
          title="Face Animator Sample"
          src="/videos/face-animator-instruction-en.mp4"
        />
      </div>
      <div
        {...{
          className: "animation-configure-panel mt-5 d-flex flex-column gap-4",
        }}
      >
        <fieldset {...{ className: "input-block" }}>
          <legend>Video Dimensions</legend>
          <SegmentButtons
            {...{
              onChange: frameDimensionsChange,
              options: [
                { label: "Landscape (Wide)", value: "twitter_landscape" },
                { label: "Portrait (Tall)", value: "twitter_portrait" },
                { label: "Square", value: "twitter_square" },
              ],
              value: frameDimensions,
            }}
          />
        </fieldset>

        <div className="d-flex flex-column flex-lg-row gap-3">
          <div className="w-50">
            <fieldset {...{ className: "input-block" }}>
              <legend>Watermark</legend>
              <Checkbox
                {...{
                  checked: removeWatermark,
                  label: "Remove Watermark",
                  onChange: removeWatermarkChange,
                }}
              />
            </fieldset>
          </div>

          <div className="w-50">
            <fieldset {...{ className: "input-block" }}>
              <legend>Animation</legend>
              <Checkbox
                {...{
                  checked: still,
                  label: "Reduce Movement (not recommended)",
                  onChange: stillChange,
                }}
              />
              <Checkbox
                {...{
                  checked: disableFaceEnhancement,
                  label: "Disable Face Enhancer (not recommended)",
                  onChange: disableFaceEnhancementChange,
                }}
              />
            </fieldset>
          </div>
        </div>
      </div>
    </animated.div>
  );
}
