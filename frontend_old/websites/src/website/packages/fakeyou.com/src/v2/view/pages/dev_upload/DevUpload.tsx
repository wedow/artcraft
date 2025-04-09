import React, { useState } from "react";
import Panel from "components/common/Panel";
import Container from "components/common/Container";
import PageHeader from "components/layout/PageHeader";
import { useSession } from "hooks";
import { Button } from "components/common";
import { faUpload } from "@fortawesome/pro-solid-svg-icons";
import { FileType, GetFileTypeByExtension } from "@storyteller/components/src/utils/GetFileTypeByExtension";
import { UploadMedia,  UploadMediaResponse, } from "@storyteller/components/src/api/media_files/UploadMedia";
import { UploadPmx,  UploadPmxResponse, } from "@storyteller/components/src/api/media_files/UploadPmx";
import { UploadEngineAsset,  UploadEngineAssetResponse, } from "@storyteller/components/src/api/media_files/UploadEngineAsset";
import { MediaFileSubtype } from "@storyteller/components/src/api/enums/MediaFileSubtype";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";

enum UploadType {
  EngineAsset = "engine_asset",
  Image = "image",
  Audio = "audio",
  Video = "video",
  Unknown = "unknown",
}

interface DevUploadProps {}

export default function DevUpload(props: DevUploadProps) {
  const { studioAccessCheck } = useSession();

  const [file, setFile] = useState<File | null>(null);
  const [maybeMediaFileSubtype, setMaybeMediaFileSubtype] = useState<MediaFileSubtype | undefined>(undefined);
  const [uploadType, setUploadType] = useState<UploadType>(UploadType.Unknown);
  const [tokens, setTokens] = useState<string[]>([]);

  const handleFileChange = (event: any) => {
    const maybeFile = event.target.files[0];
    const fileType = GetFileTypeByExtension(maybeFile?.name || "");

    let uploadType = UploadType.Unknown;

    switch (fileType) {
      case FileType.Bvh:
      case FileType.Fbx:
      case FileType.Glb:
      case FileType.Gltf:
      case FileType.Obj:
      case FileType.Ron:
      case FileType.Pmd:
      case FileType.Vmd:
      case FileType.Pmx:
        uploadType = UploadType.EngineAsset;
        break;
      case FileType.Jpg:
      case FileType.Png:
        uploadType = UploadType.Image;
        break;
      case FileType.Mp3:
      case FileType.Wav:
        uploadType = UploadType.Audio;
        break;
      case FileType.Mp4:
        uploadType = UploadType.Video;
        break;
      case FileType.Unknown:
      default:
        uploadType = UploadType.Unknown;
        break;
    }

    setFile(maybeFile);
    setUploadType(uploadType);
  };

  const handleSubtypeChange = (ev: React.FormEvent<HTMLSelectElement>) => {
    const value = (ev.target as HTMLSelectElement).value;
    const maybeSubtype = value as MediaFileSubtype;
    setMaybeMediaFileSubtype(maybeSubtype);
  }

  const handleUpload = () => {
    if (!file) {
      console.error("no file specified for upload");
      return;
    }

    switch(uploadType) {
      case UploadType.EngineAsset:
        if (file.name.toLocaleLowerCase().endsWith("zip")) {
          UploadPmx({
            uuid_idempotency_token: uuidv4(),
            file,
            engine_category: "character",
          })
          .then((res: UploadPmxResponse) => {
            if ("media_file_token" in res) {
              setTokens([res.media_file_token, ...tokens]);
              setFile(null);
            }
          });
        } else {
          UploadEngineAsset({
            uuid_idempotency_token: uuidv4(),
            file,
            media_file_subtype: maybeMediaFileSubtype,
          })
          .then((res: UploadEngineAssetResponse) => {
            if ("media_file_token" in res) {
              setTokens([res.media_file_token, ...tokens]);
              setFile(null);
            }
          });
        }
        break;
      default:
        UploadMedia({
          uuid_idempotency_token: uuidv4(),
          file,
          source: "file",
        })
        .then((res: UploadMediaResponse) => {
          if ("media_file_token" in res) {
            setTokens([res.media_file_token, ...tokens]);
            setFile(null);
          }
        });
    }
  };

  let title = "Upload Generic File";
  let mediaFileSubtypeForm = <></>;

  switch (uploadType) {
    case UploadType.Video:
      title = "Upload Video";
      break;

    case UploadType.EngineAsset:
      title = "Upload Engine Asset";
      mediaFileSubtypeForm = (
        <>
          <div className="mb-3">
            <label htmlFor="fileSubtypeSelect" className="form-label">Engine Media File Subtype</label>
            <select 
              onChange={handleSubtypeChange}
              className="form-select" 
              aria-label="Default select example" 
              id="fileSubtypeSelect"
              value={maybeMediaFileSubtype}
            >
              <option value={MediaFileSubtype.SceneImport}>Scene Import (default)</option>
              <option value={MediaFileSubtype.Mixamo}>Mixamo Animation</option>
              <option value={MediaFileSubtype.StorytellerScene}>Storyteller Scene</option>
              <option value={MediaFileSubtype.AnimationOnly}>Animation Only</option>
            </select>
          </div>
        </>
      );
      break;
  }

  return studioAccessCheck(
    <Container type="padded" className="pt-4 pt-lg-5">
      <PageHeader
        title={title}
        subText="Upload files to the server for testing."
      />

      {maybeMediaFileSubtype}

      <Panel padding={true}>
        <div className="d-flex flex-column gap-5">
          <h1>File Select</h1>

          <div className="mb-3">
            <label htmlFor="formFile" className="form-label">Select File for Upload</label>
            <input
              className="form-control form-control-lg"
              id="formFile"
              type="file"
              onChange={handleFileChange}
            />
          </div>

          {mediaFileSubtypeForm}

          <div className="d-flex gap-3 justify-content-end">
            <Button
              disabled={!file}
              icon={faUpload}
              label="Upload Media"
              onClick={handleUpload}
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