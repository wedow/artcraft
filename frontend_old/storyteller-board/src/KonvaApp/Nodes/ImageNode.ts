import Konva from "konva";
import { MediaFilesApi, MediaUploadApi } from "~/Classes/ApiManager";

import { SelectionManager } from "../NodesManagers";
import { Position, Size, NodeData, TransformationData } from "../types";

import { NetworkedNode, UploadStatus } from "./NetworkedNode";
import { NodeType, transparent } from "./constants";
import { NodeUtilities } from "./NodeUtilities";

interface ImageNodeContructor {
  canvasPosition: Position;
  canvasSize: Size;
  imageFile?: File;
  mediaFileToken?: string;
  mediaFileUrl?: string;
  transform?: TransformationData;
  mediaLayerRef: Konva.Layer;
  selectionManagerRef: SelectionManager;
}

export class ImageNode extends NetworkedNode {
  public kNode: Konva.Image;
  public imageSize?: Size;

  constructor({
    canvasPosition,
    canvasSize,
    imageFile,
    mediaFileToken,
    mediaFileUrl,
    transform: existingTransform,
    mediaLayerRef,
    selectionManagerRef,
  }: ImageNodeContructor) {
    // kNodes need to be created first to guaruntee
    // that it is not undefined in parent's context
    const transform = NodeUtilities.getInitialTransform({
      existingTransform,
      canvasPosition,
      canvasSize,
    });
    const kNode = new Konva.Image({
      image: undefined, // to do replace with placeholder
      ...transform,
      draggable: true,
      strokeScaleEnabled: false,
    });
    super({
      selectionManagerRef: selectionManagerRef,
      mediaLayerRef: mediaLayerRef,
      kNode: kNode,
      localFile: imageFile,
    });
    this.kNode = kNode;
    // this.imageSize = minNodeSize;
    this.mediaLayerRef.add(this.kNode);

    if (imageFile) {
      this.loadImageFromFile({
        imageFile: imageFile,
        maxSize: canvasSize,
        refPosition: canvasPosition,
      });
      return;
    }
    if (mediaFileUrl && transform) {
      this.mediaFileToken = mediaFileToken;
      this.mediaFileUrl = mediaFileUrl;
      this.loadImageFromUrl(mediaFileUrl);
      return;
    }
    console.log("image node creation is fucked");
  }
  private loadImageFromFile({
    imageFile,
    maxSize,
    refPosition,
  }: {
    imageFile: File;
    maxSize: Size;
    refPosition: Position;
  }) {
    const imageComponent = new Image();
    imageComponent.crossOrigin = "anonymous";
    imageComponent.onload = () => {
      this.setProgress({ progress: 0, status: UploadStatus.FILE_STAGED });
      this.imageSize = {
        width: imageComponent.width,
        height: imageComponent.height,
      };
      const adjustedSize = NodeUtilities.adjustNodeSizeToCanvas({
        componentSize: this.imageSize,
        maxSize: maxSize,
      });
      const centerPosition = NodeUtilities.positionNodeOnCanvasCenter({
        canvasOffset: refPosition,
        componentSize: adjustedSize,
        maxSize: maxSize,
      });
      this.kNode.image(imageComponent);
      this.kNode.setSize(adjustedSize);
      this.kNode.setPosition(centerPosition);

      this.kNode.fill(transparent);
      this.listenToBaseKNode();
      this.mediaLayerRef.draw();
      this.uploadImage(imageFile);
    };
    imageComponent.onerror = () => {
      this.setProgress({ progress: 0, status: UploadStatus.ERROR_ON_FILE });
    };
    imageComponent.src = URL.createObjectURL(imageFile);
  }
  private async loadImageFromUrl(mediaFileUrl: string) {
    this.setProgress({ progress: 75, status: UploadStatus.LOADING });

    const newImage = new Image();
    newImage.crossOrigin = "anonymous";
    newImage.onerror = () => {
      this.setProgress({ progress: 90, status: UploadStatus.ERROR_ON_LOAD });
    };
    newImage.onload = () => {
      // console.log("network image", newImage);
      this.kNode.image(newImage);
      this.kNode.draw();
      this.setProgress({ progress: 100, status: UploadStatus.SUCCESS });
    };
    newImage.src = mediaFileUrl;
    this.listenToBaseKNode();
  }

  private async uploadImage(imageFile: File) {
    this.setProgress({ progress: 10, status: UploadStatus.UPLOADING });

    const mediaUploadApi = new MediaUploadApi();
    const uploadResponse = await mediaUploadApi.UploadImage({
      blob: imageFile,
      uuid: this.uuidGenerate(),
      fileName: imageFile.name,
    });
    // console.log(uploadResponse);
    if (!uploadResponse.success || !uploadResponse.data) {
      this.setStatus(UploadStatus.ERROR_ON_UPLOAD, uploadResponse.errorMessage);
      return;
    }
    this.mediaFileToken = uploadResponse.data;
    this.retreiveImage(this.mediaFileToken);
  }

  private async retreiveImage(mediaFileToken: string) {
    this.setProgress({ progress: 50, status: UploadStatus.RETREIVING });
    const mediaFileApi = new MediaFilesApi();
    const mediaFileResponse = await mediaFileApi.GetMediaFileByToken({
      mediaFileToken: mediaFileToken,
    });
    // console.log(mediaFileResponse);
    if (!mediaFileResponse.success || !mediaFileResponse.data) {
      this.setStatus(
        UploadStatus.ERROR_ON_RETREIVE,
        mediaFileResponse.errorMessage,
      );
      return;
    }
    this.mediaFileUrl = mediaFileResponse.data.media_links.cdn_url;
    this.loadImageFromUrl(this.mediaFileUrl);
  }

  public async retry() {
    if (this.mediaFileUrl) {
      this.loadImageFromUrl(this.mediaFileUrl);
      return;
    }
    if (this.mediaFileToken) {
      this.retreiveImage(this.mediaFileToken);
      return;
    }
    if (this.localFile) {
      this.uploadImage(this.localFile);
      return;
    }
    console.warn("Image Node has no data to recontruct itself!");
  }
  public getNodeData(canvasPostion: Position) {
    if (!this.mediaFileUrl) {
      console.error("Image Node can not be saved");
      return null;
    }
    const data: NodeData = {
      type: NodeType.IMAGE,
      transform: {
        position: {
          x: this.kNode.position().x - canvasPostion.x,
          y: this.kNode.position().y - canvasPostion.y,
        },
        size: this.kNode.size(),
        rotation: this.kNode.rotation(),
        scale: {
          x: this.kNode.scaleX(),
          y: this.kNode.scaleY(),
        },
        zIndex: this.kNode.getZIndex(),
      },
      imageNodeData: {
        mediaFileUrl: this.mediaFileUrl,
        mediaFileToken: this.mediaFileToken,
      },
    };
    return data;
  }
}
