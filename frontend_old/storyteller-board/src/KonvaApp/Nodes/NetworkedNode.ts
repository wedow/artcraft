import Konva from "konva";
import { v4 as uuidv4 } from "uuid";
import { SelectionManager } from "../NodesManagers";
import { BaseNode } from "./BaseNode";
import { Size } from "../types";
import { LoadingVideosProvider } from "../EngineUtitlities/LoadingVideosProvider";
import { NodeProgressEventDetail } from "../types/events";

export enum UploadStatus {
  INIT = "init",
  FILE_STAGED = "file_staged",
  ERROR_ON_FILE = "error_on_file",
  UPLOADING = "uploading",
  ERROR_ON_UPLOAD = "error_on_upload",
  RETREIVING = "retreiving",
  ERROR_ON_RETREIVE = "error_on_retreive",
  LOADING = "loading",
  ERROR_ON_LOAD = "error_on_load",
  SUCCESS = "success",
}

export abstract class NetworkedNode extends BaseNode {
  public kNode: Konva.Image;

  // members to deal with loading progress
  public didFinishLoading: boolean = false;
  protected _progress: number = 0;
  protected _progressMessage?: string;
  protected progressStatus: string = UploadStatus.INIT;
  public progressEvent: EventTarget;

  // members to deal with the file carried
  protected localFile?: File;
  protected mediaFileToken?: string;
  protected mediaFileUrl?: string;
  public mediaFileSize?: Size;

  // loading screen
  protected loadingVideosProviderRef?: LoadingVideosProvider;

  // error and retry handling
  public errorMessage?: string;
  abstract retry(): void;

  constructor({
    kNode,
    selectionManagerRef,
    mediaLayerRef,
    localFile,
    loadingVideosProviderRef,
  }: {
    kNode: Konva.Image;
    selectionManagerRef: SelectionManager;
    mediaLayerRef: Konva.Layer;
    loadingVideosProviderRef?: LoadingVideosProvider;
    localFile?: File;
  }) {
    super({
      kNode,
      selectionManagerRef,
      mediaLayerRef,
    });
    this.kNode = kNode;
    this.loadingVideosProviderRef = loadingVideosProviderRef;
    this.didFinishLoading = false;
    this.progressEvent = new EventTarget();
    this.localFile = localFile;
  }
  public progress() {
    return this._progress;
  }
  public progressMessage() {
    return this._progressMessage;
  }
  public status() {
    return this.progressStatus;
  }
  public isError() {
    const errorStatues: string[] = [
      UploadStatus.ERROR_ON_FILE,
      UploadStatus.ERROR_ON_UPLOAD,
      UploadStatus.ERROR_ON_RETREIVE,
      UploadStatus.ERROR_ON_LOAD,
    ];
    return errorStatues.includes(this.progressStatus);
  }

  protected uuidGenerate() {
    return uuidv4();
  }
  protected setStatus(newStatus: string, message?: string) {
    this.progressStatus = newStatus;
    this.errorMessage = message;
    this.selectionManagerRef.updateContextComponents();
  }
  protected setProgress<S>({
    progress,
    name,
    status,
    message,
  }: {
    progress: number;
    name?: string;
    status?: S;
    message?: string;
  }) {
    this._progress = progress;
    if (message) {
      this._progressMessage = message;
    }
    if (status && typeof status === "string") {
      this.progressStatus = status;
    }

    if (this._progress === 100) {
      this.didFinishLoading = true;
    }
    // TODO: change to use
    this.progressEvent.dispatchEvent(
      new CustomEvent<NodeProgressEventDetail<S>>(
        name ? name : "GenericNodeProgress",
        {
          detail: {
            node: this,
            progress: this._progress,
            message: message,
            status: status,
          },
        },
      ),
    );
    this.selectionManagerRef.updateContextComponents();
  }
}
