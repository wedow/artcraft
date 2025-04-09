import React, { useState } from "react";
import PageHeader from "components/layout/PageHeader";
import { useMediaUploader, useSession } from "hooks";
import { Button, Container, Panel } from "components/common";
import { UploaderResponse } from "components/entities/EntityTypes";
import { faUpload } from "@fortawesome/pro-solid-svg-icons";
import { MediaFileSubtype } from "@storyteller/components/src/api/enums/MediaFileSubtype";
import { MediaFileClass } from "@storyteller/components/src/api/enums/MediaFileClass";
import { Link } from "react-router-dom";

interface DevUploadProps {}

export default function DevUploadAlt(props: DevUploadProps) {
  const [tokens, tokensSet] = useState<string[]>([]);
  const { engineSubtype, engineSubtypeChange, mediaClass, mediaClassChange, file, inputProps, isEngineAsset, isVideo, upload } = useMediaUploader({
    onSuccess: (res: UploaderResponse) => tokensSet([res.media_file_token, ...tokens])
  });

  const { onChange } = inputProps;
  const { studioAccessCheck } = useSession();

  let title = "Upload Generic File";
  let engineSubForm = <></>;

  if (isVideo) { title = "Upload Video"; }
  if (isEngineAsset) {
    title = "Upload Engine Asset";
    engineSubForm = (
      <>
        <div className="mb-3">
          <label htmlFor="fileClassSelect" className="form-label">Media Class</label>
          <select 
            onChange={mediaClassChange}
            className="form-select" 
            aria-label="Default select example" 
            id="fileClassSelect"
            value={mediaClass}
          >
            <option value={MediaFileClass.Unknown}>Unknown</option>
            <option value={MediaFileClass.Audio}>Audio</option>
            <option value={MediaFileClass.Image}>Image</option>
            <option value={MediaFileClass.Video}>Video</option>
            <option value={MediaFileClass.Animation}>Animation</option>
            <option value={MediaFileClass.Character}>Character</option>
            <option value={MediaFileClass.Prop}>Prop</option>
            <option value={MediaFileClass.Scene}>Scene</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="fileSubtypeSelect" className="form-label">Engine Media File Subtype</label>
          <select 
            onChange={engineSubtypeChange}
            className="form-select" 
            aria-label="Default select example" 
            id="fileSubtypeSelect"
            value={engineSubtype}
          >
            <option value={MediaFileSubtype.SceneImport}>Scene Import (default)</option>
            <option value={MediaFileSubtype.Mixamo}>Mixamo Animation</option>
            <option value={MediaFileSubtype.StorytellerScene}>Storyteller Scene</option>
            <option value={MediaFileSubtype.AnimationOnly}>Animation Only</option>
          </select>
        </div>
      </>
    );
  }

  return studioAccessCheck(
    <Container type="padded" className="pt-4 pt-lg-5">
      <PageHeader
        title={title}
        subText="Upload files to the server for testing."
      />

      {engineSubtype}

      <Panel padding={true}>
        <div className="d-flex flex-column gap-5">
          <h1>File Select</h1>

          <div className="mb-3">
            <label htmlFor="formFile" className="form-label">Select File for Upload</label>
            <input {...{
              onChange,
              className: "form-control form-control-lg",
              type: "file",
              id: "formFile"
            }}/>
          </div>

          {engineSubForm}

          <div className="d-flex gap-3 justify-content-end">
            <Button
              disabled={!file}
              icon={faUpload}
              label="Upload Media"
              onClick={upload}
            />
          </div>

          <h2>Your uploads</h2>
          {tokens.map((token: string, key: number) => (
            <Link {...{ key, to: `/media/${token}` }}>{token}</Link>
          ))}
        </div>
      </Panel>
    </Container>
  );
}
