import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Prompt } from "@storyteller/components/src/api/prompts/GetPrompts";
import {
  MediaFile,
  MediaLinks,
} from "@storyteller/components/src/api/media_files";
import { Button, Panel } from "components/common";
import { STYLES_BY_KEY } from "common/StyleOptions";
import { faCopy } from "@fortawesome/pro-solid-svg-icons";

interface PromptViewerProps {
  isModerator: boolean;
  mediaFile?: MediaFile;
  prompt: Prompt;
}

export default function PromptViewer({
  isModerator,
  mediaFile,
  prompt,
}: PromptViewerProps) {
  const [copyPositiveButtonText, setCopyPositiveButtonText] = useState("Copy");
  const [copyNegativeButtonText, setCopyNegativeButtonText] = useState("Copy");

  const { mainURL } = MediaLinks(mediaFile?.media_links);

  const copyToClipboard = async (
    text: string,
    copyTextSet: React.Dispatch<React.SetStateAction<string>>
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      copyTextSet("Copied!");
      setTimeout(() => copyTextSet("Copy"), 2000); // Change back after 2 seconds
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <>
      {prompt && (
        <Panel padding={true} className="mt-4">
          {isModerator && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2">
                <h6 className="fw-semibold mb-0 flex-grow-1">Download</h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">
                  <a href={mainURL.replace(".mp4", ".no_watermark.mp4")}>
                    Download Without Watermark
                  </a>{" "}
                  (Staff Only)
                </p>
              </div>
            </>
          )}
          {prompt.maybe_positive_prompt && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2">
                <h6 className="fw-semibold mb-0 flex-grow-1">Prompt</h6>
                <Button
                  icon={faCopy}
                  onClick={() =>
                    copyToClipboard(
                      prompt.maybe_positive_prompt || "",
                      setCopyPositiveButtonText
                    )
                  }
                  label={copyPositiveButtonText}
                  variant="link"
                  className="fs-7"
                />
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">{prompt.maybe_positive_prompt}</p>
              </div>
            </>
          )}
          {prompt.maybe_negative_prompt && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">
                  Negative Prompt
                </h6>
                <Button
                  icon={faCopy}
                  onClick={() =>
                    copyToClipboard(
                      prompt.maybe_negative_prompt || "",
                      setCopyNegativeButtonText
                    )
                  }
                  label={copyNegativeButtonText}
                  variant="link"
                  className="fs-7"
                />
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">{prompt.maybe_negative_prompt}</p>
              </div>
            </>
          )}

          {prompt.maybe_style_name && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">Style Name</h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">
                  {STYLES_BY_KEY.get(prompt.maybe_style_name)?.label}
                </p>
              </div>
            </>
          )}
          {prompt.maybe_strength && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">Strength</h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">{prompt.maybe_strength.toFixed(2)}</p>
              </div>
            </>
          )}
          {isModerator && prompt?.maybe_moderator_fields?.main_ipa_workflow && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">Main Workflow</h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">
                  <code>
                    {prompt?.maybe_moderator_fields?.main_ipa_workflow}
                  </code>
                </p>
              </div>
            </>
          )}
          {prompt?.used_face_detailer && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">
                  Used Face Detailer
                </h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">
                  {prompt?.used_face_detailer ? "Yes" : "No"}
                  {isModerator &&
                    prompt?.maybe_moderator_fields?.face_detailer_workflow && (
                      <>
                        &nbsp;|{" "}
                        <code>
                          {
                            prompt?.maybe_moderator_fields
                              ?.face_detailer_workflow
                          }
                        </code>
                      </>
                    )}
                </p>
              </div>
            </>
          )}
          {prompt?.use_cinematic && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">
                  Used Cinematic Mode
                </h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">{prompt?.use_cinematic ? "Yes" : "No"}</p>
              </div>
            </>
          )}
          {prompt?.used_upscaler && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">Used Upscaler</h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">
                  {prompt?.used_upscaler ? "Yes" : "No"}
                  {isModerator &&
                    prompt?.maybe_moderator_fields?.upscaler_workflow && (
                      <>
                        &nbsp;|{" "}
                        <code>
                          {prompt?.maybe_moderator_fields?.upscaler_workflow}
                        </code>
                      </>
                    )}
                </p>
              </div>
            </>
          )}
          {prompt?.lipsync_enabled && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">
                  Lipsync Enabled
                </h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">{prompt?.lipsync_enabled ? "Yes" : "No"}</p>
              </div>
            </>
          )}
          {prompt?.lcm_disabled && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">LCM Disabled</h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">{prompt?.lcm_disabled ? "Yes" : "No"}</p>
              </div>
            </>
          )}
          {isModerator &&
            mediaFile?.maybe_moderator_fields
              ?.maybe_style_transfer_source_media_file_token && (
              <>
                <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                  <h6 className="fw-semibold mb-0 flex-grow-1">Source Video</h6>
                </div>
                <div className="panel-inner p-2 rounded">
                  <p className="fs-7">
                    <Link
                      to={`/media/${mediaFile?.maybe_moderator_fields?.maybe_style_transfer_source_media_file_token}`}
                    >
                      Link to source (staff only)
                    </Link>
                  </p>
                </div>
              </>
            )}
          {isModerator && prompt?.maybe_inference_duration_millis && (
            <>
              <div className="d-flex gap-3 align-items-center mb-2 mt-3">
                <h6 className="fw-semibold mb-0 flex-grow-1">
                  Inference Duration
                </h6>
              </div>
              <div className="panel-inner p-2 rounded">
                <p className="fs-7">
                  {(
                    prompt?.maybe_inference_duration_millis /
                    1000 /
                    60
                  ).toFixed(2)}{" "}
                  minutes
                </p>
              </div>
            </>
          )}
        </Panel>
      )}
    </>
  );
}
