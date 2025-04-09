import { Coordinates } from "~/Classes/ApiManager/SegmentationApi";
import { ICommand } from "~/KonvaApp/UndoRedo/ICommand";
import { uiAccess } from "~/signals";
import { VideoExtractionEvents } from "~/KonvaApp/types/events";
import { NodeUtilities } from "~/KonvaApp/Nodes/NodeUtilities";
import { VideoNode } from "~/KonvaApp/Nodes";
import { SegmentationApi } from "~/Classes/ApiManager/SegmentationApi";
import { PointsStack } from "./PointsStack";

export class AddPointsCommand implements ICommand {
  private prevPreviewUrl: string | undefined;
  private selectedPointsRef: PointsStack;
  private nodeRef: VideoNode;
  private newPoint: Coordinates;
  private newPreviewUrl: string | undefined;
  private api: SegmentationApi;
  private sessionId: string;

  constructor({
    selectedPointsRef,
    nodeRef,
    newPoint,
    api,
    sessionId,
  }: {
    selectedPointsRef: PointsStack;
    nodeRef: VideoNode;
    newPoint: Coordinates;
    api: SegmentationApi;
    sessionId: string;
  }) {
    this.selectedPointsRef = selectedPointsRef;
    this.newPoint = newPoint;
    this.nodeRef = nodeRef;
    this.prevPreviewUrl = this.nodeRef.extractionPreviewUrl;
    this.api = api;
    this.sessionId = sessionId;
  }
  async execute() {
    this.selectedPointsRef.addPoint(this.newPoint);

    if (this.newPreviewUrl) {
      // case of redo, no need to do the server calls
      await this.nodeRef.setVideoExtractionPreview(this.newPreviewUrl);
      return true;
    }

    // request for a new point.
    uiAccess.toolbarVideoExtraction.update({
      loadingBarState: {
        progress: 25,
        status: VideoExtractionEvents.EXTRACTION_POINT_REQUEST,
        message: "Start Processing Extraction...",
      },
    });

    try {
      console.log("Requesting");
      const response = await this.api.addPointsToSession(
        this.sessionId,
        24,
        [
          {
            timestamp: 0,
            objects: [
              {
                style: {
                  color: [0, 0, 1],
                },
                object_id: 0,
                points: this.selectedPointsRef.get(),
              },
            ],
          },
        ],
        false,
      );
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 50,
          status: VideoExtractionEvents.EXTRACTION_POINT_REQUEST,
          message: "Start Processing Extraction...",
        },
      });
      const previewImageUrl = response.frames[0].preview_image_url;

      // TODO: we assumed success of the loading of the AssetUrl
      await NodeUtilities.isAssetUrlAvailable({ url: previewImageUrl });
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 75,
          status: VideoExtractionEvents.EXTRACTION_POINT_REQUEST,
          message: "Processing Extraction Points...",
        },
      });
      this.newPreviewUrl = previewImageUrl;
      await this.nodeRef.setVideoExtractionPreview(previewImageUrl);
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 100,
          status: VideoExtractionEvents.EXTRACTION_POINT_REQUEST,
          message: "Extraction of Region Done",
        },
      });
      return true;
    } catch (error) {
      console.error(error);
      ("Extraction of Region Done");
      uiAccess.toolbarVideoExtraction.update({
        loadingBarState: {
          progress: 0,
          status: VideoExtractionEvents.EXTRACTION_POINT_REQUEST,
          message: `Error:${error} Please try picking extraction points again`,
        },
      });
      return false;
    }
  }
  async undo() {
    this.selectedPointsRef.pop();

    if (this.prevPreviewUrl) {
      await this.nodeRef.setVideoExtractionPreview(this.prevPreviewUrl);
    } else {
      await this.nodeRef.loadVideoFromUrl({
        videoUrl: this.nodeRef.mediaFileUrl,
        hasExistingTransform: true,
      });
    }
  }
}
