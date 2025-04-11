import { VideoNode } from "../Nodes";
import { RGBColor } from "../types";
import { ICommand } from "./ICommand";

export class UseVideoExtraction implements ICommand {
  private videoNode: VideoNode;
  private extractionUrl?: string;
  private prevIsChroma: boolean;
  private prevChromaColor: RGBColor;

  constructor({
    videoNode,
    extractionUrl,
    prevIsChroma,
    prevChromaColor,
  }: {
    videoNode: VideoNode;
    extractionUrl: string;
    prevIsChroma: boolean;
    prevChromaColor: RGBColor;
  }) {
    this.videoNode = videoNode;
    this.extractionUrl = extractionUrl;
    this.prevIsChroma = prevIsChroma;
    this.prevChromaColor = prevChromaColor;
  }
  execute() {
    if (!this.extractionUrl) {
      return false;
    }
    this.videoNode.loadVideoFromUrl({
      videoUrl: this.extractionUrl,
      hasExistingTransform: true,
    });
    this.videoNode.setChroma(true);
    this.videoNode.setChromaColor({
      red: 120,
      green: 150,
      blue: 120,
    });
  }
  undo() {
    this.videoNode.loadVideoFromUrl({
      videoUrl: this.videoNode.mediaFileUrl,
      hasExistingTransform: true,
    });
    this.videoNode.setChroma(this.prevIsChroma);
    this.videoNode.setChromaColor(this.prevChromaColor);
  }
}
