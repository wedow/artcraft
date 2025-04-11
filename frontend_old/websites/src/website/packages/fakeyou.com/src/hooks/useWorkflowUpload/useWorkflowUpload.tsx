import { useState } from "react";
import { UploadWorkflow } from "@storyteller/components/src/api/video_workflow/UploadWorkflow";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { useInferenceJobs } from "hooks";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";

// this hook is mostly for organizational purposes while I work -V

export default function useWorkflow() {
  const [uploadPath, uploadPathSet] = useState("");
  const [title, titleSet] = useState("");
  const [description, descriptionSet] = useState("");
  const [commitHash, commitHashSet] = useState("");
  const [visibility, visibilitySet] = useState("private");

  const [writeStatus, writeStatusSet] = useState(FetchStatus.paused);

  const { enqueue } = useInferenceJobs();

  const onChange = ({ target }: { target: { name: string; value: any } }) => {
    const todo: { [key: string]: (x: any) => void } = {
      uploadPathSet,
      descriptionSet,
      titleSet,
      visibilitySet,
      commitHashSet,
    };
    todo[target.name + "Set"](target.value);
  };

  const upload = () => {
    writeStatusSet(FetchStatus.in_progress);
    console.log(`
      google_drive_link: ${uploadPath},
      title: ${title},
      description: ${description},
      commit_hash: ${commitHash},
      creator_set_visibility: ${visibility}
    `);
    UploadWorkflow("", {
      uuid_idempotency_token: uuidv4(),
      google_drive_link: uploadPath,
      title,
      description,
      commit_hash: commitHash,
      creator_set_visibility: visibility,
    })
      .then((res: any) => {
        if (res.success && res.inference_job_token) {
          writeStatusSet(FetchStatus.success);
          enqueue(
            res.inference_job_token,
            FrontendInferenceJobType.VideoWorkflow,
            true
          );
        }
      })
      .catch(err => {
        writeStatusSet(FetchStatus.error);
      });
  };
  return {
    uploadPath,
    title,
    description,
    commitHash,
    visibility,

    writeStatus,

    onChange,
    upload,
  };
}
