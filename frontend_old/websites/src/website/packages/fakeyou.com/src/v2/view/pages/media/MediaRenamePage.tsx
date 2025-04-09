import React, { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { faCircleExclamation, faEdit } from "@fortawesome/pro-solid-svg-icons";
import { usePrefixedDocumentTitle } from "common/UsePrefixedDocumentTitle";
import PageHeader from "components/layout/PageHeader";
import { Button, Container, SplitPanel, TempInput } from "components/common";
import { useSession } from "hooks";
import {
  GetMedia,
  MediaFile,
} from "@storyteller/components/src/api/media_files/GetMedia";
import { RenameMedia } from "@storyteller/components/src/api/media_files/RenameMedia";

export default function MediaRenamePage() {
  const { media_file_token } = useParams<{ media_file_token: string }>();
  const history = useHistory();

  const { canEditMediaFile } = useSession();
  const [mediaFile, setMediaFile] = useState<MediaFile | undefined>(undefined);

  const [mediaTitle, setMediaTitle] = useState("");

  usePrefixedDocumentTitle("Rename Media");

  useEffect(() => {
    GetMedia(media_file_token, {}).then(res => {
      if (res.success && res.media_file) {
        let currentTitle =
          res.media_file.maybe_title ||
          res.media_file.maybe_original_filename ||
          "";
        setMediaFile(res.media_file);
        setMediaTitle(currentTitle);
      }
    });
  }, [setMediaFile, media_file_token]);

  const performRename = async () => {
    const newTitle = mediaTitle.trim();

    RenameMedia(media_file_token, {
      name: newTitle,
    }).then((res: any) => {
      history.replace(`/media/${media_file_token}`);
    });
  };

  const onChange = (ev: React.FormEvent<HTMLInputElement>) => {
    const value = (ev.target as HTMLInputElement).value;
    setMediaTitle(value);
  };

  if (!canEditMediaFile(mediaFile?.maybe_creator_user?.user_token || "")) {
    return (
      <Container type="panel">
        <PageHeader
          titleIcon={faCircleExclamation}
          title="Access Denied"
          subText="You do not have permission to edit this file."
          panel={true}
          extension={
            <div className="d-flex">
              <Button
                label="Back to homepage"
                to={`/media/${media_file_token}`}
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
        title="Rename Media"
        titleIcon={faEdit}
        subText="Rename the file to make it easier to find"
        panel={false}
        showBackButton={true}
        backbuttonLabel="Back"
        backbuttonTo={`/media/${media_file_token}`}
      />
      <SplitPanel {...{ busy: false }}>
        <SplitPanel.Body padding={true}>
          <TempInput
            {...{
              label: "New Name",
              name: "title",
              onChange: onChange,
              placeholder: "File name",
              value: mediaTitle,
            }}
          />
        </SplitPanel.Body>
        <SplitPanel.Footer padding={true}>
          <div className="d-flex gap-2 justify-content-end">
            <Button
              {...{
                label: "Cancel",
                to: `/media/${media_file_token}`,
                variant: "secondary",
              }}
            />
            <Button
              {...{
                label: "Rename File",
                onClick: performRename,
              }}
            />
          </div>
        </SplitPanel.Footer>
      </SplitPanel>
    </Container>
  );
  //}
}
