import React, { useState } from "react";
import { faDeleteLeft } from "@fortawesome/pro-solid-svg-icons";
import Panel from "components/common/Panel/Panel";
import TextArea from "components/common/TextArea";
import { Button } from "components/common";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { faVolumeUp } from "@fortawesome/free-solid-svg-icons";
import useVoiceRequests from "../../voice_designer/useVoiceRequests";
import { v4 as uuidv4 } from "uuid";
import Accordion from "components/common/Accordion";
import { SessionVoiceDesignerInferenceResultsList } from "v2/view/_common/SessionVoiceDesignerInferenceResultsList";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useInferenceJobs } from "hooks";

interface VdInferencePanelProps {
  voiceToken: string;
}

export default function VdInferencePanel({
  voiceToken,
}: VdInferencePanelProps) {
  const [textBuffer, setTextBuffer] = useState("");
  const { inference } = useVoiceRequests({});
  const [isEnqueuing, setIsEnqueuing] = useState(false);

  const { enqueueInferenceJob, inferenceJobs } = useInferenceJobs();

  const handleEnqueueTts = () => {
    setIsEnqueuing(true);
    inference
      .enqueue("", {
        uuid_idempotency_token: uuidv4(),
        text: textBuffer,
        voice_token: voiceToken,
      })
      .then((res: any) => {
        if (res && res.success) {
          enqueueInferenceJob(
            res.inference_job_token,
            FrontendInferenceJobType.VoiceDesignerTts
          );
        }
      })
      .catch(error => {
        console.error("Error enqueuing TTS:", error);
      })
      .finally(() => {
        setIsEnqueuing(false);
      });
  };

  const handleChangeText = (ev: React.FormEvent<HTMLTextAreaElement>) => {
    const textValue = (ev.target as HTMLTextAreaElement).value;
    setTextBuffer(textValue);
  };

  const handleClearText = () => {
    setTextBuffer("");
  };

  return (
    <Panel padding={true}>
      <form>
        <div className="d-flex flex-column gap-3">
          <h4 className="fw-semibold">
            <FontAwesomeIcon icon={faVolumeUp} className="me-3" />
            Generate TTS
          </h4>
          <TextArea
            placeholder="Enter the text you want your character to say here..."
            value={textBuffer}
            onChange={handleChangeText}
            rows={6}
          />
        </div>

        <div className="d-flex gap-2 justify-content-end mt-3">
          <Button
            icon={faDeleteLeft}
            label="Clear"
            variant="danger"
            onClick={handleClearText}
            disabled={textBuffer.length === 0}
          />
          <Button
            icon={faVolumeUp}
            label="Speak"
            onClick={handleEnqueueTts}
            isLoading={isEnqueuing}
            disabled={textBuffer.length === 0}
          />
        </div>
      </form>

      {inferenceJobs && inferenceJobs.length && (
        <div className="mt-4">
          <Accordion>
            <Accordion.Item title="Session TTS Results" defaultOpen={true}>
              <div className="p-3">
                <SessionVoiceDesignerInferenceResultsList />
              </div>
            </Accordion.Item>
          </Accordion>
        </div>
      )}
    </Panel>
  );
}
