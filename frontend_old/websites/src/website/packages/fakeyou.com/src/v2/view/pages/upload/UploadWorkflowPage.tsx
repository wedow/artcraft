import React from "react";
import {
  faCircleExclamation,
  faEye,
  faArrowsTurnToDots,
} from "@fortawesome/free-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import PageHeader from "components/layout/PageHeader";
import {
  Button,
  Container,
  SplitPanel,
  TempInput,
  TempSelect,
  TempTextArea,
} from "components/common";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import InferenceJobsList from "components/layout/InferenceJobsList";
import useWorkflowUpload from "hooks/useWorkflowUpload";
import { useSession } from "hooks";

export default function UploadWorkflowPage() {
  usePrefixedDocumentTitle("Edit Voice");
  const { sessionWrapper } = useSession();

  const visibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
  ];

  const failures = (fail = "") => {
    switch (fail) {
      default:
        return "Uknown failure";
    }
  };

  const {
    //state values
    uploadPath,
    title,
    description,
    commitHash,
    visibility,
    // callback functions
    onChange,
    upload,
  } = useWorkflowUpload();

  if (!sessionWrapper.isLoggedIn()) {
    return (
      <Container type="panel">
        <PageHeader
          titleIcon={faCircleExclamation}
          title="Access Denied"
          subText="This weight does not exist or is not owned by you."
          panel={true}
          extension={
            <div className="d-flex">
              <Button
                label="Back to homepage"
                to={`/weight/{}`}
                className="d-flex"
              />
            </div>
          }
        />
      </Container>
    );
  }

  return (
    <Container type="panel">
      <InferenceJobsList
        {...{
          failures,
          jobType: FrontendInferenceJobType.VideoWorkflow,
        }}
      />
      <PageHeader
        title="Upload Workflow"
        titleIcon={faArrowsTurnToDots}
        subText="Upload a Workflow. Once your weight is successfully uploaded, you'll be able to start using it and sharing it with others."
        panel={false}
      />

      <SplitPanel dividerFooter={true}>
        <SplitPanel.Body padding={true}>
          <div className="row gx-4 gy-3">
            <div className="col-12 col-lg-7 order-first order-lg-last">
              <TempInput
                {...{
                  label: "Download URL, eg. Google Drive link",
                  name: "uploadPath",
                  onChange,
                  placeholder: "Download URL",
                  value: uploadPath,
                  required: true,
                }}
              />
              <TempInput
                {...{
                  label: "Title",
                  name: "title",
                  onChange,
                  placeholder: "Title",
                  value: title,
                  required: true,
                }}
              />
              <TempTextArea
                {...{
                  label: "Description",
                  name: "description",
                  onChange,
                  placeholder: "Description",
                  value: description,
                }}
              />
              <TempInput
                {...{
                  label: "Commit Hash",
                  name: "commitHash",
                  onChange,
                  placeholder: "Commit Hash",
                  value: commitHash,
                }}
              />

              <TempSelect
                {...{
                  icon: faEye,
                  label: "Visibility",
                  name: "visibility",
                  onChange,
                  options: visibilityOptions,
                  value: visibility,
                }}
              />
            </div>
          </div>
        </SplitPanel.Body>
        <SplitPanel.Footer padding={true}>
          <div className="d-flex gap-2 justify-content-end">
            <Button
              {...{
                label: "Upload Workflow",
                onClick: upload,
              }}
            />
          </div>
        </SplitPanel.Footer>
      </SplitPanel>
    </Container>
  );
}
