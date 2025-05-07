import { UploaderState } from "./UploadedState";

export interface UploadImageArgs {
  title: string;
  assetFile: File;
  progressCallback: (newState: UploaderState) => void;
}
