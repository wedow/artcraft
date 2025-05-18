import { VideoNode } from "../Nodes";
import { RGBColor } from "../types";
import { ICommand } from "./ICommand";

export class AddChromaKey implements ICommand {
  private videoNode: VideoNode;
  private prevIsChroma: boolean;
  private prevChromaColor: RGBColor;
  private newChromaColor: RGBColor;

  constructor({
    videoNode,
    newChromaColor,
  }: {
    videoNode: VideoNode;
    newChromaColor: RGBColor;
  }) {
    this.videoNode = videoNode;
    this.prevIsChroma = videoNode.isChroma;
    this.prevChromaColor = videoNode.chromaColor;
    this.newChromaColor = newChromaColor;
  }
  execute() {
    this.videoNode.setChroma(true);
    this.videoNode.setChromaColor(this.newChromaColor);
  }
  undo() {
    this.videoNode.setChroma(this.prevIsChroma);
    this.videoNode.setChromaColor(this.prevChromaColor);
  }
}
