import React from "react";
import { useParams } from "react-router-dom";
import {
  faCircleExclamation,
  faEye,
  faLanguage,
  faWaveform,
} from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import PageHeader from "components/layout/PageHeader";
import {
  Button,
  Container,
  CoverImageInput,
  Panel,
  Skeleton,
  SplitPanel,
  TempInput,
  TempSelect,
  TempTextArea,
} from "components/common";
import { BucketConfig } from "@storyteller/components/src/api/BucketConfig";
import { useSession, useWeightFetch } from "hooks";
import "./WeightEditPage.scss";
import { LanguageLabels } from "@storyteller/components/src/api/Languages";
import { WeightCategory } from "@storyteller/components/src/api/_common/enums";
import TagsInput from "components/common/TagsInput/TagsInput";

export default function WeightEditPage() {
  const { user, canEditTtsModel } = useSession();
  // const [language, languageSet] = useState("en");
  // const [fetched, fetchedSet] = useState(false);
  // const history = useHistory();
  const { weight_token } = useParams<{ weight_token: string }>();

  const {
    coverImg,
    data: weight,
    descriptionMD,
    // fetchError,
    // imgMediaFile,
    isLoading,
    onChange,
    title,
    update,
    visibility,
    languageTag,
    writeStatus,
    tags,
    tagsSet,
    // status
  } = useWeightFetch({ token: weight_token });

  const basePath =
    weight?.cover_image?.maybe_cover_image_public_bucket_path || "";
  const currentPath = basePath ? new BucketConfig().getGcsUrl(basePath) : "";

  usePrefixedDocumentTitle("Edit Voice");

  const visibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
  ];

  const languageOptions = Object.entries(LanguageLabels).map(
    ([value, label]) => ({
      label,
      value,
    })
  );

  let weightToken = weight?.creator?.user_token;

  if (isLoading) {
    return (
      <Container type="panel" className="mt-5">
        <Panel padding={true}>
          <div className="d-flex flex-column gap-3">
            <Skeleton type="short" />
            <Skeleton height="40px" />
            <Skeleton type="short" />
            <Skeleton height="40px" />
            <div className="d-flex justify-content-end mt-3 gap-2">
              <Skeleton height="40px" width="120px" />
              <Skeleton height="40px" width="120px" />
            </div>
          </div>
        </Panel>
      </Container>
    );
  } else {
    if (!weightToken) {
      return (
        <Container type="panel" className="mt-5">
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

    if (!canEditTtsModel(user?.user_token || "")) {
      return (
        <Container type="panel">
          <PageHeader
            titleIcon={faCircleExclamation}
            title="Access Denied"
            subText="You do not have permission to edit this model."
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
      <Container type="panel" className="mb-5">
        <PageHeader
          title="Edit Weight"
          titleIcon={faWaveform}
          subText="Make changes to your weight details"
          panel={false}
          showBackButton={true}
          backbuttonLabel="Back"
          backbuttonTo={`/weight/${weight_token}`}
        />
        <SplitPanel {...{ busy: writeStatus > 0, dividerFooter: true }}>
          <SplitPanel.Body padding={true}>
            <div {...{ className: "weight-editor row gy-3 gx-4" }}>
              <div {...{ className: "col-12 col-lg-5" }}>
                <label className="sub-title">Cover Image</label>
                <CoverImageInput
                  {...{
                    currentPath,
                    onClick: coverImg.upload,
                    status: coverImg.status,
                    ...coverImg.fileProps,
                  }}
                />
              </div>
              <div {...{ className: "col-lg-7 order-first  order-lg-last" }}>
                <TempInput
                  {...{
                    label: "Title",
                    name: "title",
                    onChange,
                    placeholder: "Title",
                    value: title,
                  }}
                />
                {(weight?.weight_category === WeightCategory.TTS ||
                  weight?.weight_category === WeightCategory.VC) && (
                  <TempSelect
                    {...{
                      icon: faLanguage,
                      label: "Language",
                      name: "languageTag",
                      options: languageOptions,
                      onChange,
                      placeholder: "Select language",
                      value: languageTag,
                    }}
                  />
                )}

                <TagsInput
                  label="Tags"
                  value={tags}
                  onChange={tagsSet}
                  className="mb-3"
                  tagsLimit={10}
                />

                <TempSelect
                  {...{
                    icon: faEye,
                    label: "Visibility",
                    name: "visibility",
                    options: visibilityOptions,
                    onChange,
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
                  label: "Cancel",
                  to: `/weight/${weight_token}`,
                  variant: "secondary",
                }}
              />
              <Button
                {...{
                  label: "Save Changes",
                  onClick: update,
                }}
              />
            </div>
          </SplitPanel.Footer>
        </SplitPanel>
      </Container>
    );
  }
}
