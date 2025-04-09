import { VideoNode } from "../Nodes";
import { RGBColor } from "../types";
import { ICommand } from "./ICommand";

export class RemoveChromaKey implements ICommand {
  private videoNode: VideoNode;
  private prevIsChroma: boolean;
  private prevChromaColor: RGBColor;

  constructor({ videoNode }: { videoNode: VideoNode }) {
    this.videoNode = videoNode;
    this.prevIsChroma = videoNode.isChroma;
    this.prevChromaColor = videoNode.chromaColor;
  }
  execute() {
    this.videoNode.setChroma(false);
  }
  undo() {
    this.videoNode.setChroma(this.prevIsChroma);
    this.videoNode.setChromaColor(this.prevChromaColor);
  }
}
