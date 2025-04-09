import { useState } from "react";
import {
  UploadImageMedia,
  UploadImageMediaResponse,
} from "@storyteller/components/src/api/media_files/UploadImageMedia";
import { FetchStatus } from "@storyteller/components/src/api/_common/SharedFetchTypes";
import { v4 as uuidv4 } from "uuid";
import { useFile } from "hooks";

export default function useCoverImgUpload() {
  const fileProps = useFile({});
  const [token, tokenSet] = useState("");
  const [status, statusSet] = useState(FetchStatus.ready);

  const upload = (e: any) => {
    if (fileProps.file && status < 2) {
      statusSet(FetchStatus.in_progress);
      UploadImageMedia({
        uuid_idempotency_token: uuidv4(),
        file: fileProps.file,
      }).then((res: UploadImageMediaResponse) => {
        if ("media_file_token" in res) {
          statusSet(FetchStatus.success);
          tokenSet(res.media_file_token);
        }
      });
    }
  };

  return { fileProps, status, token, upload };
}
