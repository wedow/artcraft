import React from "react";
import {
  faCircleExclamation,
  faEye,
  faWaveform,
} from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import PageHeader from "components/layout/PageHeader";
import {
  Button,
  Container,
  CoverImageInput,
  SplitPanel,
  TempInput,
  TempSelect,
  TempTextArea,
} from "components/common";
import { FrontendInferenceJobType } from "@storyteller/components/src/jobs/InferenceJob";
import InferenceJobsList from "components/layout/InferenceJobsList";
import useLoraUpload from "hooks/useLoraUpload";
import { useSession } from "hooks";

export default function UploadLoraWeightPage() {
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
    coverImg,
    descriptionMD,
    onChange,
    title,
    upload,
    uploadPath,
    visibility,
  } = useLoraUpload();

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
          jobType: FrontendInferenceJobType.ImageGeneration,
        }}
      />
      <PageHeader
        title="Upload LoRA Weight"
        titleIcon={faWaveform}
        subText="Upload a LoRA model weight. Once your weight is successfully uploaded, you'll be able to start using it and sharing it with others."
        panel={false}
      />

      <SplitPanel dividerFooter={true}>
        <SplitPanel.Body padding={true}>
          <div className="row gx-4 gy-3">
            <div className="col-12 col-lg-5">
              <label className="sub-title required">Cover Image</label>
              <CoverImageInput
                {...{
                  currentPath: "",
                  onClick: coverImg.upload,
                  status: coverImg.status,
                  ...coverImg.fileProps,
                }}
              />
            </div>
            <div className="col-12 col-lg-7 order-first order-lg-last">
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

              <TempSelect
                {...{
                  icon: faEye,
                  label: "Visibility",
                  name: "visibility",
                  onChange,
                  options: visibilityOptions,
                  placeholder: "Voice name",
                  value: visibility,
                }}
              />
              <TempTextArea
                {...{
                  label: "Description",
                  name: "descriptionMD",
                  onChange,
                  placeholder: "Description",
                  value: descriptionMD,
                }}
              />
            </div>
          </div>
        </SplitPanel.Body>
        <SplitPanel.Footer padding={true}>
          <div className="d-flex gap-2 justify-content-end">
            <Button
              {...{
                label: "Upload Weight",
                onClick: upload,
              }}
            />
          </div>
        </SplitPanel.Footer>
      </SplitPanel>
    </Container>
  );
}
