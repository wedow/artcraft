import React, { useState } from "react";
import {
  faArrowRightArrowLeft,
  // faFile,
  // faTrashAlt,
} from "@fortawesome/pro-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Container, Panel } from "components/common";
// import FileInput from "components/common/FileInput";
import PageHeader from "components/layout/PageHeader";
// import { useHistory, useParams } from "react-router-dom";
// import { v4 as uuidv4 } from "uuid";
// import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import FbxToGltfJobList from "./components/FbxToGltfJobList";
import // EnqueueFbxToGltf,
// EnqueueFbxToGltfIsSuccess,
// EnqueueFbxToGltfIsError,
"@storyteller/components/src/api/file_conversion/EnqueueFbxToGltf";
import { onChanger } from "resources";

import { EntityInput } from "components/entities";

// interface FbxToGltfPageProps {}

export default function FbxToGltfPage() {
  const [mediaToken, mediaTokenSet] = useState();
  const onChange = onChanger({ mediaTokenSet });

  // const EnqueueConvert = async ({ upload_token }: any) => {
  //   if (!upload_token) return false;

  //   try {
  //     let request = {
  //       uuid_idempotency_token: uuidv4(),
  //       file_source: undefined,
  //       media_file_token: upload_token,
  //     };

  //     const response = await EnqueueFbxToGltf(request);

  //     if (EnqueueFbxToGltfIsSuccess(response)) {
  //       console.log("Enqueue successful");

  //       if (response && response.inference_job_token) {
  //         enqueueInferenceJob(
  //           response.inference_job_token,
  //           FrontendInferenceJobType.ConvertFbxtoGltf
  //         );
  //       }
  //       return true;
  //     } else if (EnqueueFbxToGltfIsError(response)) {
  //       throw new Error("Enqueue failed");
  //     }
  //   } catch (error) {
  //     console.error("Error in enqueueing conversion: ", error);
  //     return false;
  //   }
  // };

  return (
    <Container type="panel">
      <PageHeader
        title="Convert FBX to glTF"
        subText="For converting 3D model assets on FBX format to glTF 2.0 for use with Storyteller Studio."
        imageUrl="/images/header/fbx-to-gltf.png"
      />

      <div className="mb-4">
        <FbxToGltfJobList />
      </div>

      <Panel padding={true}>
        <div className="d-flex flex-column gap-3">
          <EntityInput
            {...{
              accept: ["engine_asset"],
              aspectRatio: "landscape",
              label: "Choose FBX file",
              name: "mediaToken",
              onChange,
              // owner: "echelon",
              type: "media",
            }}
          />
          {
            //   mediaToken && presetFile ? (
            //   <div>
            //     <label className="sub-title">FBX file from media</label>
            //     <Panel className="panel-inner p-3 rounded">
            //       <div className="d-flex gap-3 align-items-center flex-wrap">
            //         <div className="d-flex gap-3 flex-grow-1 align-items-center">
            //           <FontAwesomeIcon icon={faFile} className="display-6" />
            //           <div>
            //             <h6 className="mb-1">{presetFile.token}</h6>
            //             <p className="opacity-75">
            //               Created by {presetFile.maybe_creator_user?.display_name}
            //             </p>
            //           </div>
            //         </div>
            //         <Button
            //           icon={faTrashAlt}
            //           square={true}
            //           onClick={clearMediaToken}
            //           variant="danger"
            //           small={true}
            //           tooltip="Remove file"
            //         />
            //       </div>
            //     </Panel>
            //   </div>
            // ) : (
            //   <FileInput
            //     {...fileProps}
            //     label="Select FBX File"
            //     fileTypes={["FBX"]}
            //     mediaToken={mediaToken}
            //   />
            // )
          }

          <div className="d-flex justify-content-end">
            <Button
              icon={faArrowRightArrowLeft}
              label="Convert to glTF"
              // onClick={submit}
              disabled={!mediaToken}
              isLoading={false} // REPLACE
            />
          </div>
        </div>
      </Panel>
    </Container>
  );
}
