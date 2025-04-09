import { useState } from "react";
import { UploadLora } from "@storyteller/components/src/api/image_generation/UploadLora";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { useCoverImgUpload, useInferenceJobs } from "hooks";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import { v4 as uuidv4 } from "uuid";

// this hook is mostly for organizational purposes while I work -V

export default function useLoraUpload() {
  const [title, titleSet] = useState("");
  const [uploadPath, uploadPathSet] = useState("");
  const [visibility, visibilitySet] = useState("public");
  const [descriptionMD, descriptionMDSet] = useState("");
  const [writeStatus, writeStatusSet] = useState(FetchStatus.paused);
  const coverImg = useCoverImgUpload();
  const { enqueue } = useInferenceJobs();

  const onChange = ({ target }: { target: { name: string; value: any } }) => {
    const todo: { [key: string]: (x: any) => void } = {
      descriptionMDSet,
      uploadPathSet,
      titleSet,
      visibilitySet,
    };
    todo[target.name + "Set"](target.value);
  };

  const upload = () => {
    writeStatusSet(FetchStatus.in_progress);
    UploadLora("", {
      ...(coverImg.token
        ? { maybe_cover_image_media_file_token: coverImg.token }
        : {}),
      maybe_name: title,
      maybe_description: descriptionMD,
      uuid_idempotency_token: uuidv4(),
      //type_of_inference: "inference",
      maybe_lora_upload_path: uploadPath,
      visibility,
    })
      .then((res: any) => {
        if (res.success && res.inference_job_token) {
          writeStatusSet(FetchStatus.success);
          enqueue(
            res.inference_job_token,
            FrontendInferenceJobType.ImageGeneration,
            true
          );
        }
      })
      .catch(err => {
        writeStatusSet(FetchStatus.error);
      });
  };
  return {
    coverImg,
    descriptionMD,
    onChange,
    title,
    upload,
    uploadPath,
    visibility,
    writeStatus,
  };
}
